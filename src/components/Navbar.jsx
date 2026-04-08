"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { LogIn, LogOut, Menu, X, ShoppingCart, User, LayoutDashboard, Newspaper, ShoppingBag } from "lucide-react";
import { useState } from "react";
import CartSidebar from "./CartSidebar";

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          {/* Logo */}
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '8px' }}>DS</div>
            <span className="hide-on-mobile">AR.SHOP</span>
          </Link>

          {/* Desktop Links */}
          <div className="hide-on-mobile" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link href="/" className="nav-link">Tienda</Link>
            <Link href="/blog" className="nav-link">Blog</Link>
            {user && <Link href="/admin" className="nav-link">Admin</Link>}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Cart Button */}
            <button 
                onClick={() => setIsCartOpen(true)}
                style={{ position: 'relative', padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-subtle)', color: 'var(--text-main)', display: 'flex' }}
            >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                    <span style={{ 
                        position: 'absolute', top: '-5px', right: '-5px', 
                        background: 'var(--primary)', color: 'white', 
                        fontSize: '0.65rem', fontWeight: '800', 
                        width: '18px', height: '18px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        borderRadius: '50%', border: '2px solid white'
                    }}>
                        {cartCount}
                    </span>
                )}
            </button>

            {user ? (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} className="hide-on-mobile">
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>Hola, {user.displayName?.split(' ')[0] || 'User'}</div>
                    <button onClick={logout} style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: '600' }}>Cerrar sesión</button>
                </div>
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--primary-light)' }} />
                ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}><User size={18} /></div>
                )}
              </div>
            ) : (
              <button onClick={login} className="btn-primary hide-on-mobile" style={{ padding: '0.5rem 1.25rem' }}>
                <LogIn size={18} /> Entrar
              </button>
            )}

            {/* Mobile Toggle */}
            <button className="show-on-mobile" onClick={() => setIsOpen(!isOpen)} style={{ color: 'var(--text-main)' }}>
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="mobile-menu animate-fade-in" style={{
              position: 'absolute', top: 'var(--navbar-height)', left: 0, width: '100%',
              background: 'white', borderBottom: '1px solid var(--border)', padding: '2rem 1rem',
              display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 1000
          }}>
            <Link href="/" className="nav-link" onClick={() => setIsOpen(false)} style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ShoppingBag size={20} /> Tienda
            </Link>
            <Link href="/blog" className="nav-link" onClick={() => setIsOpen(false)} style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Newspaper size={20} /> Blog
            </Link>
            {user && (
                <Link href="/admin" className="nav-link" onClick={() => setIsOpen(false)} style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <LayoutDashboard size={20} /> Panel Admin
                </Link>
            )}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            {user ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <img src={user.photoURL} alt="Profile" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                        <span style={{ fontWeight: '700' }}>{user.displayName}</span>
                    </div>
                    <button onClick={logout} style={{ color: 'var(--error)', fontWeight: '700' }}><LogOut size={20} /></button>
                </div>
            ) : (
                <button onClick={() => { login(); setIsOpen(false); }} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <LogIn size={20} /> Iniciar Sesión
                </button>
            )}
          </div>
        )}
      </nav>

      {/* Sidebar Global */}
      <CartSidebar />
    </>
  );
}
