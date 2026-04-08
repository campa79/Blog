"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import PostForm from "@/components/PostForm";
import PostItem from "@/components/PostItem";
import { useAuth } from "@/context/AuthContext";
import { Search as SearchIcon, Filter, Newspaper, LogIn, LayoutGrid, List } from "lucide-react";
import Image from "next/image";

export default function BlogPage() {
  const { user, loading: authLoading, login } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPosts = posts.filter(post => {
    const contentText = post.content ? post.content.toLowerCase() : "";
    const authorText = post.authorName ? post.authorName.toLowerCase() : "";
    const matchesSearch = contentText.includes(searchTerm.toLowerCase()) || 
                         authorText.includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || post.authorEmail === user?.email;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      
      {/* Blog Hero Header */}
      <section style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '1rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '800', marginBottom: '1.5rem' }}>
             <Newspaper size={16} /> EL BLOG DE LA COMUNIDAD
          </div>
          <h1 className="animate-fade-in" style={{ marginBottom: '1rem' }}>Historias de <span style={{ color: 'var(--primary)' }}>Desarrollo</span></h1>
          <p className="animate-fade-in" style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Compartiendo conocimiento, experiencias y el día a día de la tecnología.
          </p>
      </section>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        
        {/* Auth Section / Post Form */}
        <div style={{ marginBottom: '3rem' }}>
            {authLoading ? (
                <div className="card-premium skeleton" style={{ height: '150px' }}></div>
            ) : user ? (
                <PostForm />
            ) : (
                <div className="card-premium" style={{ textAlign: 'center', background: 'white', padding: '3rem 2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Unite a la conversación</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Debes iniciar sesión para poder publicar y participar en el blog comunitario.</p>
                    <button onClick={login} className="btn-primary" style={{ gap: '0.75rem' }}>
                        <LogIn size={20} /> Iniciar sesión con Google
                    </button>
                </div>
            )}
        </div>

        {/* Filters and Search Bar */}
        {user && !authLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <SearchIcon size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar publicaciones..."
                        style={{ 
                            width: '100%', 
                            padding: '1rem 1rem 1rem 3.5rem', 
                            borderRadius: 'var(--rounded-lg)', 
                            border: '1px solid var(--border)',
                            fontSize: '1rem',
                            outline: 'none',
                            background: 'white',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    <button 
                        onClick={() => setFilter('all')}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '999px',
                            background: filter === 'all' ? 'var(--primary)' : 'white',
                            color: filter === 'all' ? 'white' : 'var(--text-muted)',
                            border: filter === 'all' ? '1px solid var(--primary)' : '1px solid var(--border)',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Todo el feed
                    </button>
                    <button 
                        onClick={() => setFilter('mine')}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '999px',
                            background: filter === 'mine' ? 'var(--primary)' : 'white',
                            color: filter === 'mine' ? 'white' : 'var(--text-muted)',
                            border: filter === 'mine' ? '1px solid var(--primary)' : '1px solid var(--border)',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Mis publicaciones
                    </button>
                </div>
            </div>
        )}

        {/* Posts Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {loading ? (
                [1,2,3].map(i => (
                    <div key={i} className="card-premium skeleton" style={{ height: '300px' }}></div>
                ))
            ) : filteredPosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                    <Newspaper size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ color: 'var(--text-muted)' }}>No se encontraron publicaciones</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Intentá con otros términos de búsqueda.</p>
                </div>
            ) : (
                filteredPosts.map(post => (
                    <PostItem key={post.id} post={post} />
                ))
            )}
        </div>

      </div>
    </div>
  );
}
