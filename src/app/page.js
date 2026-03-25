"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import PostForm from "@/components/PostForm";
import PostItem from "@/components/PostItem";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ paddingTop: '1rem', maxWidth: '680px', margin: '0 auto' }}>
      {authLoading ? (
        <div style={{ textAlign: 'center', padding: '1rem' }} className="text-secondary">Cargando usuario...</div>
      ) : user ? (
        <PostForm />
      ) : (
        <div className="card" style={{ textAlign: 'center', backgroundColor: 'var(--surface)' }}>
          Inicia sesión para poder publicar en el blog.
        </div>
      )}

      {loading || authLoading ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '200px' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : user ? (
        <div className="posts-feed">
          {posts.length === 0 ? (
            <div className="card text-secondary" style={{ textAlign: 'center' }}>
              No hay posts aún. ¡Sé el primero en publicar!
            </div>
          ) : (
            posts.map(post => (
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
