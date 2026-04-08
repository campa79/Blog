"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { 
    Package, 
    Users, 
    Plus, 
    Trash2, 
    Edit, 
    X, 
    Save, 
    CheckCircle, 
    UserPlus,
    Lock,
    Image as ImageIcon,
    UploadCloud
} from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]); // Array de archivos File
  const [imagePreviews, setImagePreviews] = useState([]); // Array de URLs (blobs o remotas)
  const [loading, setLoading] = useState(false);

  // Editing state
  const [editingProduct, setEditingProduct] = useState(null);

  // Data state
  const [products, setProducts] = useState([]);
  const [adminEmails, setAdminEmails] = useState([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState("products");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user === null) return;
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (user.email === "alberto.campagna@bue.edu.ar") {
      setIsAdmin(true);
      fetchProducts();
      fetchAdmins();
      return;
    }
    const q = collection(db, "admins");
    const snap = await getDocs(q);
    const listed = snap.docs.map((d) => d.data().email);
    if (listed.includes(user.email)) {
      setIsAdmin(true);
      fetchProducts();
      fetchAdmins();
    } else {
      router.push("/");
    }
  };

  const fetchAdmins = async () => {
    const snap = await getDocs(collection(db, "admins"));
    setAdminEmails(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setDescription(product.description || "");
    setImages([]); // Se vacían los archivos nuevos al empezar a editar
    setImagePreviews(product.imageUrls || [product.imageUrl] || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setStock("");
    setDescription("");
    setImages([]);
    setImagePreviews([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imagePreviews.length > 5) {
        alert("Podes subir un máximo de 5 fotos por producto.");
        return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removePreview = (index) => {
      // Si estamos editando y quitamos una imagen que ya estaba online
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
      // También quitar del array de archivos nuevos si corresponde
      // Nota: Esto es simplificado, asume que los archivos nuevos están al final
      setImages(prev => prev.filter((_, i) => i !== (index - (imagePreviews.length - images.length))));
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !stock) {
      alert("Completá al menos nombre, precio y stock.");
      return;
    }
    if (imagePreviews.length === 0) {
      alert("Agregá al menos una foto del producto.");
      return;
    }
    setLoading(true);

    try {
      // 1. Mantener las URLs que ya son remotas (las que no son blob:)
      let finalUrls = imagePreviews.filter(url => url.startsWith('http'));

      // 2. Subir las nuevas imágenes (las que hay en el estado 'images')
      for (let imgFile of images) {
        const uploadRes = await fetch(
          `/api/upload?filename=${encodeURIComponent(imgFile.name)}`,
          { method: "POST", body: imgFile }
        );
        if (!uploadRes.ok) throw new Error("Error subiendo imagen: " + imgFile.name);
        const data = await uploadRes.json();
        finalUrls.push(data.url);
      }

      const productData = {
        name,
        price: Number(price),
        stock: Number(stock),
        description,
        imageUrls: finalUrls,
        imageUrl: finalUrls[0], // Mantener por compatibilidad con código viejo
        updatedAt: new Date().toISOString(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);
        showSuccess("✅ Producto actualizado correctamente");
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: new Date().toISOString(),
        });
        showSuccess("✅ Producto cargado con éxito");
      }

      cancelEdit();
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este producto permanentemente?")) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin) return;
    await addDoc(collection(db, "admins"), { email: newAdmin });
    setNewAdmin("");
    fetchAdmins();
    showSuccess("✅ Administrador agregado");
  };

  const handleRemoveAdmin = async (id) => {
    if (confirm("¿Quitar permisos de administrador?")) {
      await deleteDoc(doc(db, "admins", id));
      fetchAdmins();
    }
  };

  if (!user || !isAdmin) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }} className="animate-fade-in">
          <Lock size={48} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Acceso Restringido</h2>
          <p style={{ color: "var(--text-muted)" }}>Verificando credenciales de administrador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: "3rem", display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
            <h1 style={{ fontSize: "2.25rem", color: "var(--text-main)" }}>Panel Admin</h1>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Cargá productos con múltiples fotos.</p>
        </div>
        <div style={{ background: 'var(--primary-light)', padding: '0.5rem 1rem', borderRadius: 'var(--rounded-md)', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem' }}>
            {user.email}
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 3000,
          background: "white", color: "var(--text-main)", padding: "1rem 1.5rem",
          borderRadius: "var(--rounded-lg)", boxShadow: "var(--shadow-lg)",
          display: "flex", alignItems: "center", gap: "0.75rem", borderLeft: "4px solid var(--accent)"
        }}>
          <CheckCircle color="var(--accent)" />
          {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <button onClick={() => setActiveTab('products')} style={{ padding: '0.5rem 1rem', color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'products' ? '2px solid var(--primary)' : '2px solid transparent', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} /> Productos
            </button>
            <button onClick={() => setActiveTab('admins')} style={{ padding: '0.5rem 1rem', color: activeTab === 'admins' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'admins' ? '2px solid var(--primary)' : '2px solid transparent', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} /> Administradores
            </button>
        </div>

        {activeTab === "products" && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 400px)', gap: '2rem', alignItems: 'start' }} className="admin-responsive-layout">
                
                {/* Lista */}
                <div style={{ order: 2 }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Inventario ({products.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {products.map(p => (
                            <div key={p.id} className="card-premium" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
                                <div style={{ width: '64px', height: '64px', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={p.imageUrls?.[0] || p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>${p.price} • Stock: {p.stock} • {p.imageUrls?.length || 1} fotos</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <button onClick={() => startEdit(p)} style={{ padding: '0.5rem', color: 'var(--primary)' }}><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(p.id)} style={{ padding: '0.5rem', color: 'var(--error)' }}><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div style={{ order: 1 }}>
                    <div className="card-premium" style={{ background: editingProduct ? 'var(--primary-light)' : 'white', position: 'sticky', top: '100px' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>{editingProduct ? 'Editar' : 'Nuevo Producto'}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" style={inputStyle} required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Precio" style={inputStyle} required />
                                <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock" style={inputStyle} required />
                            </div>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" style={{ ...inputStyle, height: '80px' }} />
                            
                            <div style={{ border: '2px dashed var(--border)', padding: '1.5rem', borderRadius: 'var(--rounded-md)', textAlign: 'center', background: 'var(--bg-subtle)' }}>
                                <UploadCloud size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Subí hasta 5 fotos</p>
                                <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ fontSize: '0.85rem' }} />
                            </div>

                            {imagePreviews.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                                    {imagePreviews.map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button 
                                                type="button" 
                                                onClick={() => removePreview(idx)}
                                                style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.8)', color: 'white', padding: '2px', borderBottomLeftRadius: '4px' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingProduct && <button type="button" onClick={cancelEdit} className="btn-outline" style={{ flex: 1 }}>Cancelar</button>}
                                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                                    {loading ? 'Subiendo...' : editingProduct ? 'Guardar' : 'Publicar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {activeTab === "admins" && (
            <div className="card-premium" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Accesos Admin</h3>
                <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    <input type="email" value={newAdmin} onChange={e => setNewAdmin(e.target.value)} placeholder="Nuevo admin email" style={inputStyle} />
                    <button type="submit" className="btn-primary"><Plus size={20} /></button>
                </form>
                {adminEmails.map(adm => (
                    <div key={adm.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                        <span>{adm.email}</span>
                        <button onClick={() => handleRemoveAdmin(adm.id)} style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        )}
      </div>

      <style jsx>{`
          @media (max-width: 900px) {
              .admin-responsive-layout { grid-template-columns: 1fr !important; }
              .admin-responsive-layout > div { position: relative !important; top: 0 !important; }
          }
      `}</style>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--rounded-md)', border: '1px solid var(--border)', outline: 'none', fontFamily: 'inherit' };
const labelStyle = { fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' };
