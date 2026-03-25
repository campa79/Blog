"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { Send, Loader2 } from "lucide-react";

export default function PostForm({ existingPost = null, onComplete = () => {} }) {
  const { user } = useAuth();
  const [content, setContent] = useState(existingPost?.content || "");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const postData = {
        content: content.trim(),
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
      onComplete();
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error al guardar el post. Revisa tu consola.");
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !content.trim()}
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
