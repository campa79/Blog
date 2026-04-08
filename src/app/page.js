"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
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
        // Actualizar la cantidad asegurando no pasar del stock original
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
      // Registrar la orden al endpoint 
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart,
          buyerEmail: user.email,
          total: cartTotal
        })
      });

      if (!response.ok) {
         throw new Error("Error procesando pago");
      }

      // Actualizar el stock en Firebase (opcional pero deseado)
      for (let item of cart) {
          const productRef = doc(db, "products", item.id);
          const newStock = item.stock - item.quantity;
          await updateDoc(productRef, { stock: newStock });
      }

      setCheckoutStatus("¡Compra exitosa! Nos comunicaremos al administrador con tus datos.");
      setCart([]);
      fetchProducts(); // refresh stock
    } catch (error) {
      console.error(error);
      setCheckoutStatus("Hubo un error al procesar tu orden.");
    }
  };

  return (
    <div className="container" style={{ display: 'flex', gap: '2rem', padding: '2rem 1rem' }}>
      {/* Catálogo de Productos */}
      <div style={{ flex: 3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)'}}>Tech Store</h1>
        </div>

        {loading ? (
          <p>Cargando catálogo...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
            {products.length === 0 && <p style={{ color: 'var(--text-secondary)'}}>Próximamente habrá productos en la tienda.</p>}
          </div>
        )}
      </div>

      {/* Carrito Lateral */}
      <div style={{ flex: 1, minWidth: '320px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', position: 'sticky', top: '100px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             🛒 Tu Carrito
          </h2>
          
          {cart.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '2rem 0' }}>El carrito está vacío</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.quantity} x ${item.price}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '600' }}>${item.price * item.quantity}</span>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '1.2rem' }}>
                      ✖
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '1rem', borderTop: '2px dashed var(--border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                  <span>Total:</span>
                  <span>${cartTotal}</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  style={{ width: '100%', padding: '1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  Finalizar Compra
                </button>
                {checkoutStatus && <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: checkoutStatus.includes("error") ? 'red' : 'green' }}>{checkoutStatus}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  const [qty, setQty] = useState(1);
  const isOutOfStock = product.stock <= 0;

  return (
    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'transform 0.2s', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '100%', height: '220px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={product.imageUrl} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontFamily: 'var(--font-sans)', fontWeight: '600' }}>{product.name}</h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#1A73E8' }}>${product.price}</p>
        
        <div style={{ flexGrow: 1 }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: isOutOfStock ? 'red' : 'var(--text-secondary)', marginRight: 'auto' }}>
            {isOutOfStock ? "Agotado" : `Stock: ${product.stock}`}
          </span>
          {!isOutOfStock && (
             <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: '8px' }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: '30px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }}>-</button>
                <span style={{ width: '30px', textAlign: 'center', fontSize: '0.9rem' }}>{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ width: '30px', height: '30px', border: 'none', background: 'transparent', cursor: 'pointer' }}>+</button>
             </div>
          )}
        </div>
        
        <button 
          onClick={() => { onAdd(product, qty); setQty(1); }}
          disabled={isOutOfStock}
          style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', backgroundColor: isOutOfStock ? '#d1d5db' : '#202124', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
        >
          {isOutOfStock ? "Sin Stock" : "Agregar al Carrito"}
        </button>
      </div>
    </div>
  );
}
