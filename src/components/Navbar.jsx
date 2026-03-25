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
        <Link href="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2px', 
          textDecoration: 'none',
          fontSize: '1.8rem',
          fontWeight: '700',
          letterSpacing: '-1px',
          fontFamily: 'var(--font-sans)',
          lineHeight: '1'
        }}>
          <span style={{ color: '#1A73E8' }}>{'{'}</span>
          <span style={{ color: '#1A73E8' }}>desarrollo</span>
          <span style={{ color: '#202124' }}>desoftware</span>
          <span style={{ color: '#1A73E8' }}>.ar</span>
          <span style={{ color: '#1A73E8' }}>{'}'}</span>
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
