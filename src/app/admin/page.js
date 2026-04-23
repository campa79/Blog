"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { 
    Package, 
    Users, 
    Plus, 
    Trash2, 
    Edit, 
    X, 
    Save, 
    CheckCircle, 
    Activity,
    BarChart3,
    FileText,
    Calendar,
    Mail,
    Lock,
    UploadCloud,
    Image as ImageIcon
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
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);

  // UI state
  const [activeTab, setActiveTab] = useState("products");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user === null) return;
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    const email = user.email.toLowerCase().trim();
    
    // Superadmin maestro
    if (email === "alberto.campagna@bue.edu.ar") {
      setIsAdmin(true);
      fetchAllData();
      return;
    }

    try {
      const adminRef = doc(db, "admins", email);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        setIsAdmin(true);
        fetchAllData();
      } else {
        // Fallback: búsqueda por campo email en toda la colección
        const snap = await getDocs(collection(db, "admins"));
        const listed = snap.docs.map((d) => d.data().email?.toLowerCase().trim());
        
        if (listed.includes(email)) {
          setIsAdmin(true);
          fetchAllData();
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Error verificando admin:", error);
      router.push("/");
    }
  };

  const fetchAllData = () => {
    fetchProducts();
    fetchAdmins();
    fetchUsers();
    fetchStats();
  };

  const fetchAdmins = async () => {
    const snap = await getDocs(collection(db, "admins"));
    setAdminEmails(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setRegisteredUsers(snap.docs.map(d => d.data()));
  };

  const fetchStats = async () => {
    const postSnap = await getDocs(collection(db, "posts"));
    setTotalPosts(postSnap.size);
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
    const cleanEmail = newAdmin.toLowerCase().trim();
    // Usamos el email como ID para que las reglas de seguridad sean más eficientes
    await setDoc(doc(db, "admins", cleanEmail), { 
      email: cleanEmail,
      addedAt: new Date().toISOString()
    });
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
      <div style={{ marginBottom: "2rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
        <div>
            <h1 className="admin-title" style={{ color: "var(--text-main)", margin: 0 }}>Panel Admin (v2)</h1>
            <p style={{ color: "var(--text-muted)", margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Gestioná tu tienda y estadísticas.</p>
        </div>
        <div style={{ background: 'var(--primary-light)', padding: '0.4rem 0.75rem', borderRadius: 'var(--rounded-md)', color: 'var(--primary)', fontWeight: '700', fontSize: '0.75rem' }}>
            {user.email}
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="toast-admin">
          <CheckCircle size={20} color="var(--accent)" />
          <span>{successMsg}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Tabs Navigation */}
        <div className="admin-tabs">
            <button onClick={() => setActiveTab('products')} className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}>
                <Package size={18} /> Productos
            </button>
            <button onClick={() => setActiveTab('admins')} className={`admin-tab-btn ${activeTab === 'admins' ? 'active' : ''}`}>
                <Users size={18} /> Admins
            </button>
            <button onClick={() => setActiveTab('stats')} className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}>
                <BarChart3 size={18} /> Stats
            </button>
        </div>

        {activeTab === "products" && (
            <div className="admin-responsive-layout">
                
                {/* Lista */}
                <div className="admin-list-container">
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Inventario ({products.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-lg)' }}>
                                <Package size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>No hay productos cargados.</p>
                            </div>
                        ) : (
                            products.map(p => (
                                <div key={p.id} className="card-premium animate-slide-in" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem' }}>
                                    <div style={{ width: '56px', height: '56px', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={p.imageUrls?.[0] || p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>${p.price.toLocaleString()} • Stock: {p.stock}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.1rem' }}>
                                        <button onClick={() => startEdit(p)} className="btn-icon-admin"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(p.id)} className="btn-icon-admin text-error"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Form */}
                <div className="admin-form-container">
                    <div className="card-premium" style={{ background: editingProduct ? 'var(--primary-light)' : 'white' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={labelStyle}>Nombre del producto</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Remera Algodón" style={inputStyle} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={labelStyle}>Precio ($)</label>
                                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" style={inputStyle} required />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={labelStyle}>Stock</label>
                                    <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" style={inputStyle} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={labelStyle}>Descripción</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Contale a tus clientes de qué se trata..." style={{ ...inputStyle, height: '100px', resize: 'none' }} />
                            </div>
                            
                            <div className="upload-zone">
                                <UploadCloud size={24} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.8rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>Fotos del producto</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Máximo 5 imágenes</p>
                                <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ fontSize: '0.75rem', width: '100%' }} />
                            </div>

                            {imagePreviews.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                                    {imagePreviews.map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button 
                                                type="button" 
                                                onClick={() => removePreview(idx)}
                                                style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '3px', borderBottomLeftRadius: '6px' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {editingProduct && <button type="button" onClick={cancelEdit} className="btn-outline" style={{ flex: 1 }}>Cancelar</button>}
                                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '0.85rem' }}>
                                    {loading ? 'Subiendo...' : editingProduct ? 'Guardar' : 'Publicar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {activeTab === "admins" && (
            <div className="card-premium" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Gestionar Accesos</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Agregá el email de las personas que podrán administrar la tienda.</p>
                <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    <input type="email" value={newAdmin} onChange={e => setNewAdmin(e.target.value)} placeholder="email@ejemplo.com" style={inputStyle} />
                    <button type="submit" className="btn-primary" style={{ padding: '0 1rem' }}><Plus size={20} /></button>
                </form>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {adminEmails.map(adm => (
                        <div key={adm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Mail size={16} className="text-muted" />
                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{adm.email}</span>
                            </div>
                            <button onClick={() => handleRemoveAdmin(adm.id)} style={{ color: 'var(--error)', padding: '0.5rem' }}><Trash2 size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === "stats" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                    <div className="card-premium stat-card">
                        <div className="stat-icon-wrapper primary"><Users size={24} /></div>
                        <div>
                            <span className="stat-label">USUARIOS</span>
                            <h2 className="stat-value">{registeredUsers.length}</h2>
                        </div>
                    </div>
                    <div className="card-premium stat-card">
                        <div className="stat-icon-wrapper accent"><FileText size={24} /></div>
                        <div>
                            <span className="stat-label">POSTS</span>
                            <h2 className="stat-value">{totalPosts}</h2>
                        </div>
                    </div>
                    <div className="card-premium stat-card">
                        <div className="stat-icon-wrapper subtle"><Package size={24} /></div>
                        <div>
                            <span className="stat-label">PRODUCTOS</span>
                            <h2 className="stat-value">{products.length}</h2>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="card-premium" style={{ padding: '1.25rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem' }}>
                        <Activity className="text-primary" /> Auditoría de Accesos
                    </h3>
                    <div style={{ overflowX: 'auto', margin: '0 -0.5rem', padding: '0 0.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '450px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={thSmallStyle}>USUARIO</th>
                                    <th style={thSmallStyle}>EMAIL</th>
                                    <th style={thSmallStyle}>ÚLTIMA VEZ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registeredUsers.sort((a,b) => new Date(b.lastLogin) - new Date(a.lastLogin)).map((u, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem 0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <img src={u.photoURL} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-subtle)' }} />
                                                <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{u.displayName || 'Sin nombre'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem 0', fontSize: '0.8rem' }}>
                                            {u.email}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(u.lastLogin).toLocaleDateString()} {new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>

      <style jsx>{`
          .admin-tabs {
              display: flex; 
              gap: 0.5rem; 
              border-bottom: 1px solid var(--border); 
              overflow-x: auto;
              padding-bottom: 0.25rem;
              scrollbar-width: none;
          }
          .admin-tabs::-webkit-scrollbar { display: none; }

          .admin-tab-btn {
              padding: 0.75rem 1.25rem; 
              color: var(--text-muted); 
              background: transparent;
              border: none;
              border-bottom: 2px solid transparent; 
              fontWeight: 700; 
              display: flex; 
              align-items: center; 
              gap: 0.5rem;
              white-space: nowrap;
              cursor: pointer;
              transition: all 0.2s ease;
              font-size: 0.9rem;
          }
          .admin-tab-btn.active {
              color: var(--primary);
              border-bottom-color: var(--primary);
          }

          .admin-responsive-layout {
              display: grid;
              grid-template-columns: 1fr 380px;
              gap: 2rem;
              align-items: start;
          }

          .btn-icon-admin {
              padding: 0.5rem;
              background: transparent;
              border: none;
              cursor: pointer;
              color: var(--primary);
              border-radius: 4px;
          }
          .btn-icon-admin:hover { background: var(--bg-subtle); }
          .btn-icon-admin.text-error { color: var(--error); }

          .upload-zone {
              border: 2px dashed var(--border); 
              padding: 1.25rem; 
              border-radius: var(--rounded-md); 
              text-align: center; 
              background: var(--bg-subtle);
              transition: border-color 0.2s ease;
          }
          .upload-zone:hover { border-color: var(--primary); }

          .toast-admin {
              position: fixed; bottom: 24px; right: 24px; z-index: 3000;
              background: white; color: var(--text-main); padding: 1rem 1.5rem;
              border-radius: var(--rounded-lg); boxShadow: var(--shadow-lg);
              display: flex; alignItems: center; gap: 0.75rem; border-left: 4px solid var(--accent);
          }

          .stat-card { display: flex; alignItems: center; gap: 1rem; padding: 1.25rem; }
          .stat-icon-wrapper { padding: 0.75rem; borderRadius: var(--rounded-lg); }
          .stat-icon-wrapper.primary { background: var(--primary-light); color: var(--primary); }
          .stat-icon-wrapper.accent { background: var(--accent-light); color: var(--accent); }
          .stat-icon-wrapper.subtle { background: var(--bg-subtle); color: var(--text-main); }
          .stat-label { fontSize: 0.75rem; color: var(--text-muted); fontWeight: 700; textTransform: uppercase; }
          .stat-value { margin: 0; fontSize: 1.5rem; fontWeight: 900; }

          @media (max-width: 900px) {
              .admin-responsive-layout { grid-template-columns: 1fr !important; gap: 1.5rem; }
              .admin-form-container { order: 1; }
              .admin-list-container { order: 2; }
              .admin-title { font-size: 1.75rem !important; }
              .toast-admin { left: 24px; right: 24px; bottom: 24px; }
          }
      `}</style>
    </div>
  );
}

const inputStyle = { 
    width: '100%', 
    padding: '0.75rem', 
    borderRadius: 'var(--rounded-md)', 
    border: '1px solid var(--border)', 
    outline: 'none', 
    fontFamily: 'inherit',
    fontSize: '0.9rem'
};
const labelStyle = { 
    fontSize: '0.7rem', 
    fontWeight: '800', 
    color: 'var(--text-muted)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em' 
};
const thSmallStyle = { 
    padding: '1rem 0', 
    fontSize: '0.7rem', 
    color: 'var(--text-muted)', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em' 
};
