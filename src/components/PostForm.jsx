"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { Image as ImageIcon, Video, Send, X, Loader2 } from "lucide-react";

export default function PostForm({ existingPost = null, onComplete = () => {} }) {
  const { user } = useAuth();
  const [content, setContent] = useState(existingPost?.content || "");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState(existingPost?.media || (existingPost?.imageUrl ? [{ url: existingPost.imageUrl, type: 'image' }] : []));
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  if (!user) return null;

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newMediaFiles = [...mediaFiles, ...files];
      setMediaFiles(newMediaFiles);

      const newPreviews = files.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? 'video' : 'image',
        file: file
      }));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const removeMedia = (index) => {
    const newPreviews = [...previews];
    const itemToRemove = newPreviews[index];
    
    // If it was a newly added file, remove it from mediaFiles too
    if (itemToRemove.file) {
      const newMediaFiles = mediaFiles.filter(f => f !== itemToRemove.file);
      setMediaFiles(newMediaFiles);
    }
    
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && previews.length === 0) return;

    setLoading(true);
    try {
      const finalMedia = [];

      // Loop through previews to decide what to upload and what to keep
      for (const item of previews) {
        if (item.file) {
          // It's a new file, upload it
          const response = await fetch(`/api/upload?filename=${encodeURIComponent(item.file.name)}`, {
            method: 'POST',
            body: item.file,
          });

          if (!response.ok) throw new Error('Upload failed');
          const blob = await response.json();
          finalMedia.push({ url: blob.url, type: item.type });
        } else {
          // It's an existing URL
          finalMedia.push({ url: item.url, type: item.type });
        }
      }

      const postData = {
        content: content.trim(),
        media: finalMedia,
        imageUrl: finalMedia.length > 0 && finalMedia[0].type === 'image' ? finalMedia[0].url : (existingPost?.imageUrl || ""),
        authorName: user.displayName || user.email.split("@")[0],
        authorEmail: user.email,
        authorPhoto: user.photoURL,
        updatedAt: serverTimestamp(),
      };

      if (existingPost) {
        await updateDoc(doc(db, "posts", existingPost.id), postData);
      } else {
        await addDoc(collection(db, "posts"), {
          ...postData,
          createdAt: serverTimestamp(),
          reactions: { "👍": 0, "❤️": 0, "💡": 0, "😮": 0 },
        });
      }

      setContent("");
      setMediaFiles([]);
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onComplete();
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error al guardar el post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-premium" style={{ marginBottom: "2rem", border: 'none', padding: '1.5rem' }}>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="¿Qué estás pensando?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: '1.1rem', marginBottom: '1rem', fontFamily: 'inherit', background: 'transparent', color: 'var(--text-main)' }}
        />

        {previews.length > 0 && (
          <div className="previews-grid">
            {previews.map((item, index) => (
              <div key={index} className="preview-item">
                {item.type === 'video' ? (
                  <video src={item.url} muted />
                ) : (
                  <img src={item.url} alt={`Preview ${index}`} />
                )}
                {!loading && (
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="preview-remove-btn"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
              style={{ padding: '0.5rem', borderRadius: '50%', width: '42px', height: '42px', display: 'grid', placeItems: 'center' }}
              title="Añadir fotos o videos"
            >
              <div style={{ position: 'relative' }}>
                <ImageIcon size={20} style={{ position: 'absolute', top: -5, left: -5 }} />
                <Video size={20} style={{ position: 'absolute', bottom: -5, right: -5, opacity: 0.7 }} />
              </div>
            </button>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*,video/*"
              multiple
              onChange={handleMediaChange}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (!content.trim() && previews.length === 0)}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            <span>{existingPost ? "Actualizar" : "Publicar"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
