"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ShoppingBag, User, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="glass" style={{
      borderBottom: '1px solid var(--border)',
      padding: '1rem 0',
      marginBottom: '2rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* LOGO */}
        <Link href="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2px', 
          textDecoration: 'none',
          fontSize: '1.5rem',
          fontWeight: '800',
          fontFamily: 'var(--font-heading)',
          lineHeight: '1',
          zIndex: 1001
        }}>
          <span style={{ color: 'var(--primary)' }}>{'{'}</span>
          <span style={{ color: 'var(--primary)' }}>desarrollo</span>
          <span style={{ color: 'var(--text-main)' }}>desoftware</span>
          <span style={{ color: 'var(--primary)' }}>.ar</span>
          <span style={{ color: 'var(--primary)' }}>{'}'}</span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hide-on-mobile" style={{ gap: '2rem', alignItems: 'center', fontWeight: '600' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }}>Tienda</Link>
          <Link href="/blog" style={{ color: 'var(--text-muted)' }}>Blog</Link>
          {user?.email === 'alberto.campagna@bue.edu.ar' && (
            <Link href="/admin" style={{ color: 'var(--primary)' }}>Admin</Link>
          )}
          
          <div style={{ width: '1px', height: '1.5rem', background: 'var(--border)', margin: '0 0.5rem' }}></div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400', marginBottom: '-2px' }}>Bienvenido</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{user.email.split('@')[0]}</p>
              </div>
              {user.photoURL ? (
                <Image 
                  src={user.photoURL} 
                  alt="Profile" 
                  width={38} 
                  height={38} 
                  style={{ borderRadius: '50%', border: '2px solid var(--primary-light)' }} 
                />
              ) : (
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} color="var(--primary)" />
                </div>
              )}
              <button onClick={logout} style={{ color: 'var(--text-muted)' }} title="Salir">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button onClick={login} className="btn-primary">Acceder</button>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button 
            className="show-on-mobile" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ zIndex: 1001, color: 'var(--text-main)' }}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* MOBILE OVERLAY MENU */}
        {isMenuOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: 'white',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: '6rem 2rem',
            gap: '2rem'
          }}>
            <Link onClick={() => setIsMenuOpen(false)} href="/" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>Tienda</Link>
            <Link onClick={() => setIsMenuOpen(false)} href="/blog" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>Blog</Link>
            {user?.email === 'alberto.campagna@bue.edu.ar' && (
              <Link onClick={() => setIsMenuOpen(false)} href="/admin" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>Admin</Link>
            )}
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {user.photoURL && <Image src={user.photoURL} alt="P" width={40} height={40} style={{ borderRadius: '50%' }} />}
                  <span style={{ fontWeight: '600' }}>{user.email}</span>
                </div>
                <button onClick={logout} className="btn-outline" style={{ textAlign: 'center' }}>Cerrar Sesión</button>
              </div>
            ) : (
              <button onClick={() => { login(); setIsMenuOpen(false); }} className="btn-primary" style={{ justifyContent: 'center' }}>Iniciar Sesión</button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
