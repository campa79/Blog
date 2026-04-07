"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [adminEmails, setAdminEmails] = useState([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user === null) return;
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    // Es el admin principal?
    if (user.email === "alberto.campagna@bue.edu.ar") {
       setIsAdmin(true);
       fetchProducts();
       fetchAdmins();
       return;
    }
    // Check if email is in admins collection
    const q = collection(db, "admins");
    const snap = await getDocs(q);
    const listedAdmins = snap.docs.map(d => d.data().email);
    if (listedAdmins.includes(user.email)) {
       setIsAdmin(true);
       fetchProducts();
       fetchAdmins();
    } else {
       router.push("/");
    }
  };

  const fetchAdmins = async () => {
    const q = collection(db, "admins");
    const snapshot = await getDocs(q);
    setAdminEmails(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin) return;
    try {
      await addDoc(collection(db, "admins"), { email: newAdmin });
      setNewAdmin("");
      fetchAdmins();
      alert("Administrador agregado");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const q = collection(db, "products");
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(docs);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !stock || !image) {
      alert("Por favor completa todos los campos y añade una foto.");
      return;
    }
    setLoading(true);

    try {
      // 1. Subir imagen
      const storageRef = ref(storage, `products/${Date.now()}_${image.name}`);
      await uploadBytes(storageRef, image);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Guardar producto en db
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
        stock: Number(stock),
        imageUrl: downloadURL,
        createdAt: new Date().toISOString()
      });

      alert("Producto cargado con éxito");
      setName("");
      setPrice("");
      setStock("");
      setImage(null);
      fetchProducts();
    } catch (error) {
      console.error("Error al publicar:", error);
      alert("Hubo un error cargando el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        fetchProducts();
      } catch (error) {
        console.error("Error eliminando", error);
      }
    }
  };

  const handleRemoveAdmin = async (id) => {
    if (confirm("¿Quitar permisos de administrador a este usuario?")) {
       try {
         await deleteDoc(doc(db, "admins", id));
         fetchAdmins();
       } catch (error) {
         console.error(error);
       }
    }
  };

  if (!user || (!isAdmin && user.email !== "alberto.campagna@bue.edu.ar")) {
    return <div className="container" style={{ padding: '2rem' }}><p>Verificando permisos...</p></div>;
  }

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Panel de Administración</h2>
      
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Cargar Nuevo Producto</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Nombre del producto</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Teclado Mecánico"
              className="form-input"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Precio ($)</label>
              <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ej: 15000"
                className="form-input"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Stock (Inventario)</label>
              <input 
                type="number" 
                value={stock} 
                onChange={(e) => setStock(e.target.value)}
                placeholder="Ej: 20"
                className="form-input"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '500' }}>Foto del producto</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              style={{ padding: '0.5rem 0' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.05rem', fontWeight: '600', backgroundColor: '#1A73E8', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            {loading ? "Cargando..." : "Subir Producto"}
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: '1.5rem', paddingBottom: '1rem' }}>Productos en Inventario</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {products.map(product => (
          <div key={product.id} style={{ background: 'white', borderRadius: '12px', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{product.name}</h4>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>${product.price}</p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Stock: {product.stock}</p>
            <button onClick={() => handleDelete(product.id)} style={{ width: '100%', padding: '0.5rem', color: 'red', border: '1px solid red', borderRadius: '6px', background: 'transparent', cursor: 'pointer' }}>Eliminar</button>
          </div>
        ))}
        {products.length === 0 && <p>No hay productos cargados.</p>}
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Gestión de Administradores</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Los administradores pueden subir y borrar productos.</p>
        
        <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            type="email" 
            value={newAdmin} 
            onChange={(e) => setNewAdmin(e.target.value)}
            placeholder="Email del nuevo admin"
            className="form-input"
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0 1.5rem', borderRadius: '8px', backgroundColor: '#1A73E8', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Añadir</button>
        </form>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '0.75rem', borderBottom: '1px solid var(--surface)', display: 'flex', justifyContent: 'space-between' }}>
            <span>alberto.campagna@bue.edu.ar <strong>(Dueño)</strong></span>
          </li>
          {adminEmails.map(adm => (
            <li key={adm.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--surface)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{adm.email}</span>
              <button onClick={() => handleRemoveAdmin(adm.id)} style={{ color: 'red', border: 'none', background: 'transparent', cursor: 'pointer' }}>Quitar</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
