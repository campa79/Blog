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
    AlertCircle, 
    CheckCircle, 
    UserPlus,
    Lock,
    ExternalLink
} from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Editing state
  const [editingProduct, setEditingProduct] = useState(null);

  // Data state
  const [products, setProducts] = useState([]);
  const [adminEmails, setAdminEmails] = useState([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState("products"); // "products" | "admins"
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
    setImage(null);
    setImagePreview(product.imageUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setStock("");
    setDescription("");
    setImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
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
    if (!editingProduct && !image) {
      alert("Agregá una foto del producto.");
      return;
    }
    setLoading(true);

    try {
      let imageUrl = editingProduct?.imageUrl || null;

      if (image) {
        const uploadRes = await fetch(
          `/api/upload?filename=${encodeURIComponent(image.name)}`,
          { method: "POST", body: image }
        );
        if (!uploadRes.ok) throw new Error("Error subiendo imagen");
        const data = await uploadRes.json();
        imageUrl = data.url;
      }

      const productData = {
        name,
        price: Number(price),
        stock: Number(stock),
        description,
        imageUrl,
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
    <div className="container">

      {/* Header */}
      <div style={{ marginBottom: "3rem", display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
            <h1 style={{ fontSize: "2.25rem", color: "var(--text-main)" }}>Dashboard</h1>
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Gestioná tus productos y administradores.</p>
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

      {/* Tabs Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <button 
                onClick={() => setActiveTab('products')}
                style={{ 
                    padding: '0.5rem 1rem', 
                    color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'products' ? '2px solid var(--primary)' : '2px solid transparent',
                    fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
            >
                <Package size={20} /> Productos
            </button>
            <button 
                onClick={() => setActiveTab('admins')}
                style={{ 
                    padding: '0.5rem 1rem', 
                    color: activeTab === 'admins' ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'admins' ? '2px solid var(--primary)' : '2px solid transparent',
                    fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
            >
                <Users size={20} /> Administradores
            </button>
        </div>

        {/* ===== TAB: PRODUCTOS ===== */}
        {activeTab === "products" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 400px)', gap: '2rem', alignItems: 'start' }} className="admin-responsive-layout">
                    
                    {/* Lista Inventario */}
                    <div style={{ order: 2 }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Inventario ({products.length})</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {products.map(p => (
                                <div key={p.id} className="card-premium" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem' }}>
                                    <div style={{ width: '64px', height: '64px', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>${p.price.toLocaleString('es-AR')} • Stock: {p.stock}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button onClick={() => startEdit(p)} style={{ padding: '0.5rem', color: 'var(--primary)' }} title="Editar"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(p.id)} style={{ padding: '0.5rem', color: 'var(--error)' }} title="Borrar"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay productos cargados.</p>}
                        </div>
                    </div>

                    {/* Formulario Sticky */}
                    <div style={{ order: 1, position: 'sticky', top: '100px' }}>
                        <div className="card-premium" style={{ background: editingProduct ? 'var(--primary-light)' : 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cargá los detalles del item.</p>
                                </div>
                                {editingProduct && <button onClick={cancelEdit} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>}
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Nombre del producto</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="Ej: Monitor 24\" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Precio ($)</label>
                                        <input type="number" value={price} onChange={e => setPrice(e.target.value)} required style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Stock</label>
                                        <input type="number" value={stock} onChange={e => setStock(e.target.value)} required style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Descripción</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: '80px' }} placeholder="Opcional..." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Imagen {imagePreview && '✓'}</label>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <input type="file" onChange={handleImageChange} style={{ fontSize: '0.8rem', flex: 1 }} />
                                        {imagePreview && (
                                            <div style={{ width: '50px', height: '50px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                                                <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                                    {loading ? 'Procesando...' : editingProduct ? 'Guardar Cambios' : 'Publicar Producto'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ===== TAB: ADMINS ===== */}
        {activeTab === "admins" && (
            <div className="card-premium animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserPlus size={24} /> Gestionar Accesos
                </h3>
                
                <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input type="email" value={newAdmin} onChange={e => setNewAdmin(e.target.value)} placeholder="Email del nuevo admin" style={inputStyle} />
                    <button type="submit" className="btn-primary">Añadir</button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--rounded-md)', display: 'flex', justifyContent: 'space-between', border: '1px dashed var(--primary)' }}>
                        <span style={{ fontWeight: '700' }}>alberto.campagna@bue.edu.ar</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800' }}>DOMINIO PRINCIPAL</span>
                    </div>
                    {adminEmails.map(adm => (
                        <div key={adm.id} style={{ padding: '1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--rounded-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{adm.email}</span>
                            <button onClick={() => handleRemoveAdmin(adm.id)} style={{ color: 'var(--error)' }}><Trash2 size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>

      {/* Media Query CSS simulation (as this is Next.js without TailWind, I'll add a style tag for the layout) */}
      <style jsx>{`
          @media (max-width: 900px) {
              .admin-responsive-layout {
                  grid-template-columns: 1fr !important;
              }
              .admin-responsive-layout > div {
                  position: relative !important;
                  top: 0 !important;
              }
          }
      `}</style>
    </div>
  );
}

const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--text-muted)',
    marginBottom: '0.4rem',
    display: 'block'
};

const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 'var(--rounded-md)',
    border: '1px solid var(--border)',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit'
};
