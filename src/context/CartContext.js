"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const { user, login } = useAuth();

  // Persistencia local (opcional)
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, quantity) => {
    if (quantity <= 0) return;
    if (quantity > product.stock) {
      alert("No hay suficiente stock.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) {
          alert(`Límite de stock: ${product.stock}`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });

    // UX: Abrir carrito automáticamente
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      alert("Por favor, iniciá sesión para comprar.");
      login();
      return;
    }

    setCheckoutStatus("Procesando...");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          buyerEmail: user.email,
          total: cartTotal,
        }),
      });

      if (!response.ok) throw new Error("Error en el checkout");

      // Descontar stock
      for (let item of cart) {
        const productRef = doc(db, "products", item.id);
        const newStock = item.stock - item.quantity;
        await updateDoc(productRef, { stock: newStock });
      }

      setCheckoutStatus("Tu compra fue realizada con éxito. Nos contactaremos a la brevedad.");
      clearCart();
      
      setTimeout(() => {
          setCheckoutStatus("");
          setIsCartOpen(false);
      }, 5000);
    } catch (error) {
      console.error(error);
      setCheckoutStatus("Error al procesar la orden.");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        handleCheckout,
        checkoutStatus,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
