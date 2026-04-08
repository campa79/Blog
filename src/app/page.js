"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, ShoppingBag, Plus, Minus, ChevronLeft, ChevronRight, Maximize2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, setIsCartOpen, cartCount } = useCart();

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

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      
      {/* Hero */}
      <section style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '1rem' }}>
          <h1 className="animate-fade-in" style={{ marginBottom: '1rem' }}>La tienda para <span style={{ color: 'var(--primary)' }}>desarrolladores</span></h1>
          <p className="animate-fade-in" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Descubrí productos exclusivos y detalles técnicos de cada item.
          </p>
      </section>

      {/* Main Grid */}
      <div style={{ flex: 1 }}>
        {loading ? (
          <div className="responsive-grid">
              {[1,2,3,4].map(i => (
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
              />
            ))}
          </div>
        )}
        {!loading && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <ShoppingBag size={64} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No hay productos disponibles por ahora.</p>
          </div>
        )}
      </div>

      {/* Floating Cart (Mobile only overlay trigger) */}
      {cartCount > 0 && (
          <button className="cart-floating-btn show-on-mobile" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={28} />
              <span className="cart-badge">{cartCount}</span>
          </button>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const [currentImg, setCurrentImg] = useState(0);
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl];
  const isOutOfStock = product.stock <= 0;

  const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); setCurrentImg((currentImg + 1) % images.length); };
  const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); setCurrentImg((currentImg - 1 + images.length) % images.length); };

  const goToDetail = () => {
      router.push(`/product/${product.id}`);
  };

  return (
    <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      {/* Navegar al detalle pulsando la foto */}
      <div 
        onClick={goToDetail}
        style={{ width: '100%', height: '260px', background: '#f8fafc', overflow: 'hidden', position: 'relative', cursor: 'zoom-in' }}
      >
        <img 
            src={images[currentImg]} 
            alt={product.name} 
            style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.5s ease' }} 
        />
        
        {images.length > 1 && (
            <>
                <button onClick={prevImg} style={arrowStyle} className="hover:bg-surface"><ChevronLeft size={18} /></button>
                <button onClick={nextImg} style={{ ...arrowStyle, right: '0.5rem' }} className="hover:bg-surface"><ChevronRight size={18} /></button>
            </>
        )}

        {isOutOfStock && (
            <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#fee2e2', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '800' }}>
                AGOTADO
            </div>
        )}
        
        <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', background: 'white', padding: '4px', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', color: 'var(--primary)', display: 'flex' }}>
            <Maximize2 size={14} />
        </div>
      </div>
      
      <div style={{ padding: '1.25rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 
            onClick={goToDetail}
            style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--text-main)', cursor: 'pointer' }}
            className="hover:text-primary"
        >
            {product.name}
        </h3>
        
        <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--primary)' }}>${product.price.toLocaleString('es-AR')}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>Stock: {product.stock}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isOutOfStock && (
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--border)' }}>
                        <button onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }} style={{ padding: '0.4rem' }}><Minus size={14} /></button>
                        <span style={{ width: '1.5rem', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}>{qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); setQty(Math.min(product.stock, qty + 1)); }} style={{ padding: '0.4rem' }}><Plus size={14} /></button>
                    </div>
                )}
                <button 
                    onClick={() => onAdd(product, qty)}
                    disabled={isOutOfStock}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '0.6rem' }}
                >
                    {isOutOfStock ? "Agotado" : "Agregar"}
                </button>
            </div>
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
