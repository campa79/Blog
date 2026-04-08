"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

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
  const [editingProduct, setEditingProduct] = useState(null); // null = creando nuevo

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

  // Llenar el formulario con los datos del producto a editar
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

      // Solo subir nueva imagen si seleccionó una
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
        // ACTUALIZAR producto existente
        await updateDoc(doc(db, "products", editingProduct.id), productData);
        showSuccess("✅ Producto actualizado correctamente");
      } else {
        // CREAR nuevo producto
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
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔐</div>
          <p style={{ color: "var(--text-secondary)" }}>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", margin: "0 0 0.25rem" }}>Panel de Administración</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>Bienvenido, {user.email}</p>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div style={{
          position: "fixed", top: "90px", right: "24px", zIndex: 999,
          background: "#10b981", color: "white", padding: "1rem 1.5rem",
          borderRadius: "12px", boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
          fontSize: "0.95rem", fontWeight: "500"
        }}>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", background: "#f3f4f6", padding: "0.35rem", borderRadius: "12px", width: "fit-content" }}>
        {[["products", "📦 Productos"], ["admins", "👥 Admins"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none",
            fontWeight: "600", fontSize: "0.9rem", cursor: "pointer",
            background: activeTab === key ? "white" : "transparent",
            color: activeTab === key ? "#1A73E8" : "#6b7280",
            boxShadow: activeTab === key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s"
          }}>{label}</button>
        ))}
      </div>

      {/* ===== TAB: PRODUCTOS ===== */}
      {activeTab === "products" && (
        <>
          {/* Formulario */}
          <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", marginBottom: "2rem", border: editingProduct ? "2px solid #f59e0b" : "2px solid transparent" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #f3f4f6" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>
                {editingProduct ? `✏️ Editando: ${editingProduct.name}` : "➕ Nuevo Producto"}
              </h2>
              {editingProduct && (
                <button onClick={cancelEdit} style={{ color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0.4rem 1rem", background: "white", cursor: "pointer", fontSize: "0.85rem" }}>
                  Cancelar edición
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nombre del producto *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Teclado Mecánico RGB" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Precio ($) *</label>
                  <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ej: 45000" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Stock (unidades) *</label>
                  <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)}
                    placeholder="Ej: 15" style={inputStyle} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Descripción (opcional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción breve del producto..." rows={3}
                    style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>
                    Foto del producto {editingProduct ? "(dejá vacío para mantener la actual)" : "*"}
                  </label>
                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <input type="file" accept="image/*" onChange={handleImageChange}
                        style={{ padding: "0.5rem 0", display: "block" }} />
                    </div>
                    {imagePreview && (
                      <img src={imagePreview} alt="preview"
                        style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "10px", border: "2px solid #e5e7eb" }} />
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "1rem", border: "none", borderRadius: "10px",
                fontSize: "1rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer",
                background: editingProduct ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #1A73E8, #0d47a1)",
                color: "white", transition: "opacity 0.2s", opacity: loading ? 0.7 : 1
              }}>
                {loading ? "Guardando..." : editingProduct ? "💾 Guardar Cambios" : "📤 Publicar Producto"}
              </button>
            </form>
          </div>

          {/* Lista de productos */}
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.25rem" }}>
            Inventario ({products.length} productos)
          </h2>

          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "16px", color: "#9ca3af" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
              <p>Todavía no hay productos. ¡Cargá el primero!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {products.map((product) => (
                <div key={product.id} style={{
                  background: "white", borderRadius: "14px", padding: "1.25rem",
                  display: "flex", gap: "1.25rem", alignItems: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: editingProduct?.id === product.id ? "2px solid #f59e0b" : "2px solid transparent"
                }}>
                  <img src={product.imageUrl} alt={product.name}
                    style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px", flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</h3>
                    {product.description && (
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.description}</p>
                    )}
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <span style={{ fontWeight: "700", color: "#1A73E8", fontSize: "1.1rem" }}>${Number(product.price).toLocaleString("es-AR")}</span>
                      <span style={{
                        fontSize: "0.8rem", padding: "0.2rem 0.6rem", borderRadius: "20px",
                        background: product.stock > 5 ? "#dcfce7" : product.stock > 0 ? "#fef9c3" : "#fee2e2",
                        color: product.stock > 5 ? "#166534" : product.stock > 0 ? "#854d0e" : "#991b1b",
                        fontWeight: "600"
                      }}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button onClick={() => startEdit(product)} style={{
                      padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #e5e7eb",
                      background: "white", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem",
                      color: "#374151", transition: "all 0.15s"
                    }}>✏️ Editar</button>
                    <button onClick={() => handleDelete(product.id)} style={{
                      padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #fee2e2",
                      background: "#fff5f5", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem",
                      color: "#dc2626", transition: "all 0.15s"
                    }}>🗑️ Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== TAB: ADMINS ===== */}
      {activeTab === "admins" && (
        <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: "700" }}>Gestión de Administradores</h2>
          <p style={{ color: "#6b7280", margin: "0 0 2rem", fontSize: "0.9rem" }}>
            Los admins pueden cargar, editar y eliminar productos.
          </p>

          <form onSubmit={handleAddAdmin} style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
            <input type="email" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)}
              placeholder="Email del nuevo administrador"
              style={{ ...inputStyle, flex: 1, margin: 0 }} />
            <button type="submit" style={{
              padding: "0 1.5rem", borderRadius: "10px", border: "none",
              background: "#1A73E8", color: "white", fontWeight: "700", cursor: "pointer"
            }}>Añadir</button>
          </form>

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderRadius: "10px", background: "#f0f7ff", marginBottom: "0.5rem" }}>
              <div>
                <span style={{ fontWeight: "600" }}>alberto.campagna@bue.edu.ar</span>
                <span style={{ marginLeft: "0.75rem", fontSize: "0.75rem", background: "#1A73E8", color: "white", padding: "0.2rem 0.6rem", borderRadius: "20px" }}>Dueño</span>
              </div>
            </li>
            {adminEmails.map((adm) => (
              <li key={adm.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderRadius: "10px", background: "#f9fafb", marginBottom: "0.5rem" }}>
                <span>{adm.email}</span>
                <button onClick={() => handleRemoveAdmin(adm.id)} style={{
                  color: "#dc2626", border: "1px solid #fee2e2", borderRadius: "8px",
                  padding: "0.35rem 0.75rem", background: "#fff5f5", cursor: "pointer", fontSize: "0.85rem"
                }}>Quitar</button>
              </li>
            ))}
            {adminEmails.length === 0 && (
              <p style={{ color: "#9ca3af", textAlign: "center", padding: "1.5rem 0" }}>No hay otros administradores configurados.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: "0.875rem", fontWeight: "600",
  marginBottom: "0.5rem", color: "#374151"
};

const inputStyle = {
  width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #e5e7eb",
  borderRadius: "10px", fontSize: "0.95rem", outline: "none",
  transition: "border-color 0.2s", fontFamily: "inherit",
  boxSizing: "border-box"
};
