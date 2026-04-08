"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { ShoppingCart, ShoppingBag, X, Plus, Minus, CheckCircle, ArrowRight, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState(null); // URL de la imagen para el lightbox
  const { user, login } = useAuth();
  
  const [checkoutStatus, setCheckoutStatus] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = collection(db, "products");
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(docs);
    } catch (error) {
      console.error("Error al cargar productos", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, quantity) => {
    if (quantity <= 0) return;
    if (quantity > product.stock) {
      alert("No hay suficiente stock para esa cantidad");
      return;
    }
    
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        const nuevacantidad = existing.quantity + quantity;
        if (nuevacantidad > product.stock) {
            alert(`Solo puedes llevar hasta ${product.stock} unidades de este producto.`);
            return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: nuevacantidad } : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    
    if (window.innerWidth < 768) {
        setIsCartOpen(true);
    }
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!user) {
      alert("Inicia sesión para comprar.");
      login();
      return;
    }

    setCheckoutStatus("Procesando tu compra...");
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          buyerEmail: user.email,
          total: cartTotal
        })
      });

      if (!response.ok) throw new Error("Error procesando pago");

      for (let item of cart) {
          const productRef = doc(db, "products", item.id);
          const newStock = item.stock - item.quantity;
          await updateDoc(productRef, { stock: newStock });
      }

      setCheckoutStatus("Tu compra fue realizada con éxito. Nos contactaremos a la brevedad.");
      setCart([]);
      fetchProducts();
      setTimeout(() => setCheckoutStatus(""), 5000);
    } catch (error) {
      console.error(error);
      setCheckoutStatus("Hubo un error al procesar tu orden.");
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      
      {/* Header */}
      <section style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '1rem' }}>
          <h1 className="animate-fade-in" style={{ marginBottom: '1rem' }}>La tienda para <span style={{ color: 'var(--primary)' }}>desarrolladores</span></h1>
          <p className="animate-fade-in" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Equipamiento de alta calidad con soporte para múltiples vistas por producto.
          </p>
      </section>

      <div style={{ display: 'flex', gap: '2.5rem', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="responsive-grid">
                {[1,2,3].map(i => (
                    <div key={i} className="card-premium skeleton" style={{ height: '350px' }}></div>
                ))}
            </div>
          ) : (
            <div className="responsive-grid">
              {products.map(product => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAdd={addToCart} 
                    onZoom={(url) => setZoomImage(url)}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="hide-on-mobile" style={{ width: '380px', position: 'sticky', top: '100px', alignSelf: 'flex-start' }}>
           <CartContent 
                cart={cart} 
                total={cartTotal} 
                onRemove={removeFromCart} 
                onCheckout={handleCheckout} 
                status={checkoutStatus} 
            />
        </aside>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
          <button className="cart-floating-btn show-on-mobile" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={28} />
              <span className="cart-badge">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
          </button>
      )}

      {/* Mobile Cart Overlay */}
      {isCartOpen && (
          <div className="show-on-mobile" style={{
              position: 'fixed',
              top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'flex-end'
          }}>
              <div className="animate-fade-in" style={{ background: 'white', width: '100%', maxHeight: '90vh', borderTopLeftRadius: '2rem', borderTopRightRadius: '2rem', padding: '2rem', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.5rem', margin: 0 }}>🛒 Tu Carrito</h2>
                      <button onClick={() => setIsCartOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
                  </div>
                  <CartContent cart={cart} total={cartTotal} onRemove={removeFromCart} onCheckout={handleCheckout} status={checkoutStatus} />
              </div>
          </div>
      )}

      {/* LIGHTBOX / ZOOM MODAL */}
      {zoomImage && (
          <div 
            onClick={() => setZoomImage(null)}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          >
              <button style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'white' }}><X size={32} /></button>
              <img src={zoomImage} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} alt="Zoom" />
          </div>
      )}

      {/* Checkout Toast */}
      {checkoutStatus && !isCartOpen && (
          <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '1rem 2rem', borderRadius: '999px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 3000 }}>
              <CheckCircle color="var(--accent)" />
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{checkoutStatus}</span>
          </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd, onZoom }) {
  const [currentImg, setCurrentImg] = useState(0);
  const [qty, setQty] = useState(1);
  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl];
  const isOutOfStock = product.stock <= 0;

  const nextImg = (e) => { e.stopPropagation(); setCurrentImg((currentImg + 1) % images.length); };
  const prevImg = (e) => { e.stopPropagation(); setCurrentImg((currentImg - 1 + images.length) % images.length); };

  return (
    <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      {/* Galería Slider */}
      <div style={{ width: '100%', height: '260px', background: '#f8fafc', overflow: 'hidden', position: 'relative', cursor: 'pointer' }} onClick={() => onZoom(images[currentImg])}>
        <img 
            src={images[currentImg]} 
            alt={product.name} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
        
        {/* Flechas de navegación */}
        {images.length > 1 && (
            <>
                <button onClick={prevImg} style={arrowStyle} className="hover:bg-surface"><ChevronLeft size={20} /></button>
                <button onClick={nextImg} style={{ ...arrowStyle, right: '0.5rem' }} className="hover:bg-surface"><ChevronRight size={20} /></button>
                
                {/* Dots / Puntos */}
                <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
                    {images.map((_, i) => (
                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentImg ? 'var(--primary)' : 'var(--border)', transition: 'all 0.3s' }}></div>
                    ))}
                </div>
            </>
        )}

        <button 
           onClick={(e) => { e.stopPropagation(); onZoom(images[currentImg]); }}
           style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', padding: '6px', display: 'flex', zIndex: 10 }}
        >
            <Maximize2 size={14} color="var(--text-main)" />
        </button>

        {isOutOfStock && (
            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#fee2e2', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '800', zIndex: 10 }}>
                AGOTADO
            </div>
        )}
      </div>
      
      <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{product.name}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', height: '2.5rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {product.description || "Sin descripción."}
        </p>
        
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>${product.price.toLocaleString('es-AR')}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>Stock: {product.stock}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            {!isOutOfStock && (
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--border)' }}>
                    <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '0.4rem' }}><Minus size={14} /></button>
                    <span style={{ width: '1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}>{qty}</span>
                    <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ padding: '0.4rem' }}><Plus size={14} /></button>
                </div>
            )}
            <button 
                onClick={() => { onAdd(product, qty); setQty(1); }}
                disabled={isOutOfStock}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '0.6rem', opacity: isOutOfStock ? 0.5 : 1 }}
            >
                {isOutOfStock ? "Agotado" : "Agregar"}
            </button>
        </div>
      </div>
    </div>
  );
}

const arrowStyle = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '0.5rem',
    background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%',
    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(2px)'
};

function CartContent({ cart, total, onRemove, onCheckout, status }) {
    return (
        <div className="card-premium animate-fade-in" style={{ border: 'none', background: 'white' }}>
            {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <ShoppingCart size={40} color="var(--border)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)' }}>El carrito está vacío</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ width: '50px', height: '50px', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)', overflow: 'hidden' }}>
                                    <img src={item.imageUrls?.[0] || item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: '700', fontSize: '0.9rem', margin: 0 }}>{item.name}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{item.quantity} x ${item.price.toLocaleString('es-AR')}</p>
                                </div>
                                <button onClick={() => onRemove(item.id)} style={{ color: 'var(--error)' }}><X size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', borderTop: '2px dashed var(--border)', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>Total</span>
                            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>${total.toLocaleString('es-AR')}</span>
                        </div>
                        <button 
                            onClick={onCheckout}
                            className="btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                        >
                            Finalizar Compra <ArrowRight size={18} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
