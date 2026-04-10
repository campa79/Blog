"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, increment } from "firebase/firestore";
import Image from "next/image";
import { MoreVertical, Trash2, Edit2, Clock, BookOpen, Smile, ChevronLeft, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import PostForm from "./PostForm";

export default function PostItem({ post }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  
  const isAuthor = user && post.authorEmail && user.email.toLowerCase() === post.authorEmail.toLowerCase();
  
  const dateStr = post.createdAt?.toDate().toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const wordCount = post.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Normalize media array for backward compatibility
  const mediaItems = post.media || (post.imageUrl ? [{ url: post.imageUrl, type: 'image' }] : []);

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

  const nextMedia = () => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevMedia = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Swipe handlers
  const onTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) nextMedia();
    if (isRightSwipe) prevMedia();

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (isEditing) {
    return (
      <div className="card-premium animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Editar Publicación</h3>
          <button onClick={() => setIsEditing(false)} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Cancelar</button>
        </div>
        <PostForm existingPost={post} onComplete={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div className="card-premium animate-fade-in" style={{ position: 'relative', padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {post.authorPhoto ? (
            <Image 
                src={post.authorPhoto} 
                alt={post.authorName || "User"} 
                width={44} 
                height={44} 
                style={{ borderRadius: '50%', border: '2px solid var(--primary-light)' }} 
            />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: '800' }}>
              {post.authorName ? post.authorName[0].toUpperCase() : "?"}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{post.authorName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {dateStr}
              </span>
              <span style={{ color: 'var(--border)' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BookOpen size={12} /> {readTime} min
              </span>
            </div>
          </div>
        </div>

        {isAuthor && (
          <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setShowMenu(!showMenu)} 
                style={{ padding: '8px', borderRadius: '50%', color: 'var(--text-muted)' }}
                className="hover:bg-surface"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="glass" style={{
                position: 'absolute', right: 0, top: '100%',
                border: '1px solid var(--border)',
                borderRadius: 'var(--rounded-md)', boxShadow: 'var(--shadow-lg)',
                padding: '0.5rem', zIndex: 10, minWidth: '140px'
              }}>
                <button onClick={() => { setIsEditing(true); setShowMenu(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1rem', width: '100%', borderRadius: 'var(--rounded-sm)', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '500'
                }} className="hover:bg-surface">
                  <Edit2 size={16} /> Editar
                </button>
                <button onClick={handleDelete} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1rem', width: '100%', color: 'var(--error)', borderRadius: 'var(--rounded-sm)', fontSize: '0.9rem', fontWeight: '500'
                }} className="hover:bg-surface">
                  <Trash2 size={16} /> Borrar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="markdown-content" style={{ marginBottom: '1.25rem', fontSize: '1.05rem', lineHeight: '1.7', color: '#334155' }}>
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {mediaItems.length > 0 && (
        <div 
          className="media-container"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {mediaItems.map((item, index) => (
            <div 
              key={index} 
              style={{ 
                display: index === currentIndex ? 'flex' : 'none',
                width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {item.type === 'video' ? (
                <video 
                  src={item.url} 
                  controls 
                  className="media-item"
                  playsInline
                />
              ) : (
                <img src={item.url} alt={`Media ${index}`} className="media-item" />
              )}
            </div>
          ))}

          {/* Navigation Arrows */}
          {mediaItems.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button className="carousel-nav-btn left" onClick={prevMedia}>
                  <ChevronLeft size={24} />
                </button>
              )}
              {currentIndex < mediaItems.length - 1 && (
                <button className="carousel-nav-btn right" onClick={nextMedia}>
                  <ChevronRight size={24} />
                </button>
              )}
            </>
          )}
          
          {/* Progress Indicator */}
          {mediaItems.length > 1 && (
            <div style={{
              position: 'absolute', bottom: '1rem', right: '1rem',
              backgroundColor: 'rgba(15, 23, 42, 0.6)', color: 'white',
              padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem',
              fontWeight: '600', backdropFilter: 'blur(4px)'
            }}>
              {currentIndex + 1} / {mediaItems.length}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '1.5rem', 
        paddingTop: '1rem', 
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {Object.entries(post.reactions || {}).map(([emoji, count]) => (
          <button 
            key={emoji} 
            onClick={() => handleReaction(emoji)}
            className="btn-outline"
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.9rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              borderRadius: '999px',
              border: count > 0 ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: count > 0 ? 'var(--primary-light)' : 'transparent',
              color: count > 0 ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
            <span style={{ fontWeight: '700' }}>{count}</span>
          </button>
        ))}
        {!user && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Smile size={14} /> Iniciá sesión para reaccionar
            </p>
        )}
      </div>
    </div>
  );
}
