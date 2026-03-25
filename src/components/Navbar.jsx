"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      padding: '1.25rem 0',
      marginBottom: '2rem',
      backgroundColor: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Image src="/logo.png" alt="desarrollodesoftware.ar" width={220} height={40} style={{ objectFit: 'contain', width: 'auto', height: '42px' }} />
        </Link>

        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{user.email}</span>
              {user.photoURL && (
                <Image 
                  src={user.photoURL} 
                  alt="Profile" 
                  width={32} 
                  height={32} 
                  style={{ borderRadius: '50%' }} 
                />
              )}
              <button onClick={logout} className="btn-outline">Salir</button>
            </div>
          ) : (
            <button onClick={login} className="btn-primary">Acceder</button>
          )}
        </div>
      </div>
    </nav>
  );
}
