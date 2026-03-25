"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { Image as ImageIcon, Send, X, Loader2 } from "lucide-react";

export default function PostForm({ existingPost = null, onComplete = () => {} }) {
  const { user } = useAuth();
  const [content, setContent] = useState(existingPost?.content || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(existingPost?.imageUrl || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  if (!user) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image && !existingPost?.imageUrl) return;

    setLoading(true);
    try {
      let imageUrl = existingPost?.imageUrl || "";

      if (image) {
        // Upload to Vercel Blob via API route
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(image.name)}`, {
          method: 'POST',
          body: image,
        });

        if (!response.ok) throw new Error('Upload failed');
        const blob = await response.json();
        imageUrl = blob.url;
      }

      const postData = {
        content: content.trim(),
        imageUrl: imageUrl,
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
      setImage(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onComplete();
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error al guardar el post (Vercel Blob tokens?).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="¿Qué estás pensando?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          style={{ border: 'none', resize: 'none', marginBottom: '1rem', padding: '0.5rem 0' }}
        />

        {preview && (
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <img src={preview} alt="Preview" className="post-image" style={{ filter: loading ? 'grayscale(0.5)' : 'none' }} />
            {!loading && (
              <button
                type="button"
                onClick={removeImage}
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
                  borderRadius: '50%', padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
              style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'grid', placeItems: 'center' }}
            >
              <ImageIcon size={20} />
            </button>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (!content.trim() && !image && !existingPost?.imageUrl)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {existingPost ? "Actualizar" : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}
