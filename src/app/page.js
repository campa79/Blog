"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import PostForm from "@/components/PostForm";
import PostItem from "@/components/PostItem";
import { useAuth } from "@/context/AuthContext";
import { Search as SearchIcon, Filter, Loader2 } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' or 'mine'

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
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || post.authorEmail === user?.email;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ paddingTop: '1rem', maxWidth: '680px', margin: '0 auto' }}>
      {authLoading ? (
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <div className="skeleton" style={{ flex: 1, height: 20 }} />
        </div>
      ) : user ? (
        <PostForm />
      ) : (
        <div className="card" style={{ textAlign: 'center', backgroundColor: 'var(--surface)' }}>
          Inicia sesión para poder publicar en el blog.
        </div>
      )}

      {/* Search and Filters */}
      {user && !authLoading && (
        <div className="search-container">
          <div style={{ position: 'relative', flex: 1 }}>
            <SearchIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por contenido o autor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos
            </button>
            <button 
              className={`filter-chip ${filter === 'mine' ? 'active' : ''}`}
              onClick={() => setFilter('mine')}
            >
              Mis Posts
            </button>
          </div>
        </div>
      )}

      {loading || authLoading ? (
        <div className="posts-feed">
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 15, width: '40%', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ height: 10, width: '20%' }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 100, width: '100%', marginBottom: '1rem' }} />
              <div className="skeleton" style={{ height: 10, width: '60%' }} />
            </div>
          ))}
        </div>
      ) : user ? (
        <div className="posts-feed">
          {filteredPosts.length === 0 ? (
            <div className="card text-secondary" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              {searchTerm ? "No se encontraron posts que coincidan con tu búsqueda." : "No hay posts aún. ¡Sé el primero en publicar!"}
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostItem key={post.id} post={post} />
            ))
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <Image 
              src="/logo.png" 
              alt="desarrollodesoftware.ar" 
              width={300} 
              height={60} 
              style={{ objectFit: 'contain', height: 'auto', margin: '0 auto' }} 
            />
          </div>
          <h1 style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>Bienvenido a desarrollodesoftware.ar</h1>
          <p className="text-secondary" style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
            Nuestro contenido es exclusivo para la comunidad. Por favor, inicia sesión con tu cuenta de Google para ver los posts y participar.
          </p>
        </div>
      )}
    </div>
  );
}
