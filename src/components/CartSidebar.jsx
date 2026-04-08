"use client";

import { ShoppingCart, X, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartSidebar() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    cartTotal, 
    handleCheckout, 
    checkoutStatus 
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
        zIndex: 5000, display: 'flex', justifyContent: 'flex-end'
    }} onClick={() => setIsCartOpen(false)}>
        
        <div 
            className="animate-fade-in" 
            style={{
                width: '100%', maxWidth: '450px', height: '100%',
                background: 'white', display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)'
            }}
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Tu Carrito</h2>
                <button onClick={() => setIsCartOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                        <ShoppingCart size={64} color="var(--border)" style={{ marginBottom: '1.5rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>El carrito está vacío</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '80px', height: '80px', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)', overflow: 'hidden' }}>
                                    <img src={item.imageUrls?.[0] || item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: '700', fontSize: '1rem', margin: 0 }}>{item.name}</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>{item.quantity} x ${item.price.toLocaleString('es-AR')}</p>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} style={{ color: 'var(--error)' }}><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
                <div style={{ padding: '2rem', borderTop: '2px dashed var(--border)', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-muted)' }}>Subtotal</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)' }}>${cartTotal.toLocaleString('es-AR')}</span>
                    </div>
                    <button 
                        onClick={handleCheckout}
                        className="btn-primary" 
                        style={{ width: '100%', justifyContent: 'center', padding: '1.25rem', borderRadius: 'var(--rounded-md)', fontSize: '1.1rem' }}
                    >
                        Confirmar Pedido <ArrowRight size={22} />
                    </button>
                </div>
            )}

            {/* Success Status */}
            {checkoutStatus && (
                <div style={{ position: 'absolute', bottom: '2rem', left: '1rem', right: '1rem', padding: '1.5rem', background: 'var(--accent)', color: 'white', borderRadius: 'var(--rounded-md)', textAlign: 'center', animation: 'animate-fade-in 0.3s ease' }}>
                    {checkoutStatus}
                </div>
            )}
        </div>
    </div>
  );
}
