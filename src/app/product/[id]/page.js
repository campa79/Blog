"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useCart } from "@/context/CartContext";
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowLeft, Package, ShieldCheck, Truck, Plus, Minus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const docRef = doc(db, "products", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProduct({ id: snap.id, ...snap.data() });
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
    );
  }

  if (!product) return null;

  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl];
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="container" style={{ paddingBottom: '5rem', paddingTop: '1rem' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => router.back()} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}
        className="hover:text-primary"
      >
        <ArrowLeft size={20} /> Volver a la tienda
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }} className="detail-responsive-layout">
        
        {/* Gallery Section */}
        <div>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden', height: '450px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <img src={images[currentImg]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                
                {images.length > 1 && (
                    <>
                        <button onClick={() => setCurrentImg((currentImg - 1 + images.length) % images.length)} style={arrowStyle}><ChevronLeft size={24} /></button>
                        <button onClick={() => setCurrentImg((currentImg + 1) % images.length)} style={{ ...arrowStyle, right: '1rem' }}><ChevronRight size={24} /></button>
                    </>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {images.map((img, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentImg(i)}
                            style={{ 
                                width: '80px', height: '80px', flexShrink: 0, 
                                borderRadius: 'var(--rounded-md)', overflow: 'hidden', 
                                border: i === currentImg ? '2px solid var(--primary)' : '2px solid transparent',
                                background: 'white'
                            }}
                        >
                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Info Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
                <Package size={16} /> ID: {product.id.slice(0, 8)} • {isOutOfStock ? 'Sin Stock' : `Stock disponible: ${product.stock}`}
            </div>

            <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', lineHeight: '1.1' }}>{product.name}</h1>
            
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)' }}>
                ${product.price.toLocaleString('es-AR')}
            </div>

            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.1rem' }}>
                {product.description || "Este producto no tiene una descripción detallada todavía, pero garantizamos su excelente calidad y durabilidad para el uso diario en desarrollo."}
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            {/* Purchase Controls */}
            {!isOutOfStock ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--border)', padding: '0.25rem' }}>
                        <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '0.75rem' }}><Minus size={20} /></button>
                        <span style={{ width: '3rem', textAlign: 'center', fontWeight: '800', fontSize: '1.25rem' }}>{qty}</span>
                        <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ padding: '0.75rem' }}><Plus size={20} /></button>
                    </div>
                    <button 
                        onClick={() => addToCart(product, qty)} 
                        className="btn-primary" 
                        style={{ flex: 1, padding: '1.1rem', fontSize: '1.1rem', justifyContent: 'center' }}
                    >
                        <ShoppingCart size={22} /> Agregar al Carrito
                    </button>
                </div>
            ) : (
                <div style={{ padding: '1.25rem', background: '#fee2e2', color: '#ef4444', borderRadius: 'var(--rounded-md)', fontWeight: '700', textAlign: 'center' }}>
                    Este producto se encuentra actualmente agotado.
                </div>
            )}

            {/* Perks */}
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    <ShieldCheck size={20} color="var(--accent)" /> 
                    <span><strong>Garantía Oficial:</strong> 12 meses de soporte técnico incluido.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    <Truck size={20} color="var(--accent)" /> 
                    <span><strong>Envío Prioritario:</strong> Despacho en menos de 24hs hábiles.</span>
                </div>
            </div>
        </div>
      </div>

      <style jsx>{`
          @media (max-width: 768px) {
              .detail-responsive-layout {
                  grid-template-columns: 1fr !important;
                  gap: 2rem !important;
              }
              h1 { font-size: 2rem !important; }
          }
      `}</style>
    </div>
  );
}

const arrowStyle = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem',
    background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%',
    width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)', boxShadow: 'var(--shadow-sm)'
};
