"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, increment } from "firebase/firestore";
import Image from "next/image";
import { MoreVertical, Trash2, Edit2, Clock, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import PostForm from "./PostForm";

export default function PostItem({ post }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const isAuthor = user && post.authorEmail && user.email.toLowerCase() === post.authorEmail.toLowerCase();
  
  const dateStr = post.createdAt?.toDate().toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Calculate read time (approx 200 words per minute)
  const wordCount = post.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleReaction = async (emoji) => {
    if (!user) return alert("Debes iniciar sesión para reaccionar.");
    const postRef = doc(db, "posts", post.id);
    await updateDoc(postRef, {
      [`reactions.${emoji}`]: increment(1)
    });
  };

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de que quieres borrar este post?")) {
      await deleteDoc(doc(db, "posts", post.id));
    }
  };

  if (isEditing) {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>Editar Post</h3>
          <button onClick={() => setIsEditing(false)} className="text-secondary">Cancelar</button>
        </div>
        <PostForm existingPost={post} onComplete={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {post.authorPhoto ? (
            <Image src={post.authorPhoto} alt={post.authorName} width={40} height={40} style={{ borderRadius: '50%' }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
              {post.authorName ? post.authorName[0] : "?"}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{post.authorName}</div>
            <div className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {dateStr}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BookOpen size={12} /> {readTime} min de lectura
              </span>
            </div>
          </div>
        </div>

        {isAuthor && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ padding: '4px', borderRadius: '50%' }}>
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div style={{
                position: 'absolute', right: 0, top: '100%',
                background: 'white', border: '1px solid var(--border)',
                borderRadius: '8px', boxShadow: 'var(--shadow)',
                padding: '4px', zIndex: 10, width: '120px'
              }}>
                <button onClick={() => { setIsEditing(true); setShowMenu(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', width: '100%', borderRadius: '4px'
                }} className="hover:bg-surface">
                  <Edit2 size={16} /> Editar
                </button>
                <button onClick={handleDelete} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', width: '100%', color: 'var(--error)', borderRadius: '4px'
                }} className="hover:bg-surface">
                  <Trash2 size={16} /> Borrar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="markdown-content" style={{ marginBottom: '1rem', fontSize: '1rem', lineHeight: '1.6' }}>
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {post.imageUrl && (
        <img src={post.imageUrl} alt="Post content" className="post-image" loading="lazy" />
      )}

      <div style={{ 
        marginTop: '1.5rem', 
        paddingTop: '1rem', 
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '0.75rem'
      }}>
        {Object.entries(post.reactions || {}).map(([emoji, count]) => (
          <button 
            key={emoji} 
            onClick={() => handleReaction(emoji)}
            className="btn-outline"
            style={{ 
              padding: '4px 8px', 
              fontSize: '0.875rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              borderRadius: '16px'
            }}
          >
            <span>{emoji}</span>
            <span style={{ fontWeight: count > 0 ? 600 : 400 }}>{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
