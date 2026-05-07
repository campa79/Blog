"use client"; // v2.2 forced sync

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    doc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    setDoc,
    getDoc,
    onSnapshot
} from "firebase/firestore";
import { 
    Wallet, 
    TrendingDown, 
    TrendingUp, 
    Plus, 
    Trash2, 
    Edit, 
    Calendar, 
    ChevronLeft, 
    ChevronRight,
    PieChart,
    BarChart3,
    DollarSign,
    PlusCircle,
    ArrowRightCircle,
    CheckCircle2,
    X,
    Copy,
    AlertCircle
} from "lucide-react";

export default function GastosPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Date State
    const [currentDate, setCurrentDate] = useState(new Date());
    const monthId = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const yearStr = String(currentDate.getFullYear());

    // Data State
    const [salary, setSalary] = useState(0);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAnnualView, setIsAnnualView] = useState(false);
    const [annualData, setAnnualData] = useState([]);

    // Form State
    const [isEditingSalary, setIsEditingSalary] = useState(false);
    const [newSalary, setNewSalary] = useState("");
    const [expenseCategory, setExpenseCategory] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [editingExpense, setEditingExpense] = useState(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/");
            return;
        }

        // Subscribe to current month data
        const monthRef = doc(db, "user_gastos", user.uid, "mensual", monthId);
        const unsubscribeMonth = onSnapshot(monthRef, (doc) => {
            if (doc.exists()) {
                setSalary(doc.data().salary || 0);
            } else {
                setSalary(0);
            }
        });

        const itemsRef = collection(db, "user_gastos", user.uid, "mensual", monthId, "items");
        const q = query(itemsRef, orderBy("createdAt", "desc"));
        const unsubscribeItems = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setExpenses(items);
            setLoading(false);
        });

        return () => {
            unsubscribeMonth();
            unsubscribeItems();
        };
    }, [user, authLoading, monthId]);

    // Fetch Annual Data
    useEffect(() => {
        if (isAnnualView && user) {
            fetchAnnualData();
        }
    }, [isAnnualView, yearStr, user]);

    const fetchAnnualData = async (year) => {
        setLoading(true);
        const months = [];
        const targetYear = year || yearStr;
        for (let i = 1; i <= 12; i++) {
            const mId = `${targetYear}-${String(i).padStart(2, '0')}`;
            
            // Get Salary
            const mDoc = await getDoc(doc(db, "user_gastos", user.uid, "mensual", mId));
            const mSalary = mDoc.exists() ? mDoc.data().salary : 0;

            // Get Items Total
            const itemsSnap = await getDocs(collection(db, "user_gastos", user.uid, "mensual", mId, "items"));
            const mExpenses = itemsSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

            months.push({
                month: i,
                monthName: new Date(Number(targetYear), i - 1).toLocaleString('es-ES', { month: 'long' }),
                salary: mSalary,
                expenses: mExpenses,
                savings: mSalary - mExpenses,
                savingsPercent: mSalary > 0 ? Math.max(0, ((mSalary - mExpenses) / mSalary) * 100) : 0
            });
        }
        setAnnualData(months);
        setLoading(false);
    };

    const handleSaveSalary = async () => {
        if (!newSalary || isNaN(newSalary)) return;
        const monthRef = doc(db, "user_gastos", user.uid, "mensual", monthId);
        await setDoc(monthRef, { salary: Number(newSalary) }, { merge: true });
        setIsEditingSalary(false);
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseCategory || !expenseAmount) return;

        setLoading(true);
        try {
            const itemsRef = collection(db, "user_gastos", user.uid, "mensual", monthId, "items");
            
            if (editingExpense) {
                // Usamos la ruta completa para mayor seguridad
                const docRef = doc(db, "user_gastos", user.uid, "mensual", monthId, "items", editingExpense.id);
                await updateDoc(docRef, {
                    category: expenseCategory,
                    amount: Number(expenseAmount),
                    updatedAt: new Date().toISOString()
                });
                setEditingExpense(null);
            } else {
                await addDoc(itemsRef, {
                    category: expenseCategory,
                    amount: Number(expenseAmount),
                    paid: false,
                    createdAt: new Date().toISOString()
                });
            }

            setExpenseCategory("");
            setExpenseAmount("");
        } catch (error) {
            console.error("Error al guardar gasto:", error);
            alert("Error al guardar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (confirm("¿Eliminar este gasto?")) {
            await deleteDoc(doc(db, "user_gastos", user.uid, "mensual", monthId, "items", id));
        }
    };

    const startEditExpense = (exp) => {
        setEditingExpense(exp);
        setExpenseCategory(exp.category);
        setExpenseAmount(exp.amount);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTogglePaid = async (exp) => {
        try {
            const docRef = doc(db, "user_gastos", user.uid, "mensual", monthId, "items", exp.id);
            await updateDoc(docRef, { paid: !exp.paid });
        } catch (error) {
            console.error("Error toggling paid status:", error);
        }
    };

    const handleCopyPreviousMonth = async () => {
        const prevDate = new Date(currentDate);
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevMonthId = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
        
        setLoading(true);
        try {
            const prevItemsRef = collection(db, "user_gastos", user.uid, "mensual", prevMonthId, "items");
            const snapshot = await getDocs(prevItemsRef);
            
            if (snapshot.empty) {
                alert("No se encontraron gastos en el mes anterior para copiar.");
                return;
            }

            if (!confirm(`¿Deseas copiar ${snapshot.size} gastos del mes anterior?`)) return;

            const currentItemsRef = collection(db, "user_gastos", user.uid, "mensual", monthId, "items");
            
            // Sequential add to avoid Firestore issues with many rapid writes
            for (const d of snapshot.docs) {
                const data = d.data();
                await addDoc(currentItemsRef, {
                    category: data.category,
                    amount: data.amount,
                    paid: false,
                    createdAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error("Error copying expenses:", error);
            alert("Error al copiar gastos: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const changeMonth = (offset) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    if (authLoading || (loading && expenses.length === 0 && !isAnnualView)) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="skeleton" style={{ width: '100%', maxWidth: '800px', height: '400px', borderRadius: 'var(--rounded-lg)' }}></div>
            </div>
        );
    }

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const savings = Math.max(0, salary - totalExpenses);
    const excess = totalExpenses > salary ? totalExpenses - salary : 0;
    const expensePercent = salary > 0 ? Math.min(100, (totalExpenses / salary) * 100) : 0;
    const savingsPercent = salary > 0 ? Math.max(0, (savings / salary) * 100) : 0;

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            
            {/* Header & View Toggle */}
            <div style={{ marginBottom: "2rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <h1 className="title-responsive" style={{ color: "var(--text-main)", display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <Wallet className="text-primary" size={32} /> Mis Gastos
                    </h1>
                    <p style={{ color: "var(--text-muted)", margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Gestión privada de finanzas.</p>
                </div>
                
                <div className="view-toggle-container">
                    <button 
                        onClick={() => setIsAnnualView(false)}
                        className={`toggle-btn ${!isAnnualView ? 'active' : ''}`}
                    >
                        <Calendar size={16} /> Mensual
                    </button>
                    <button 
                        onClick={() => setIsAnnualView(true)}
                        className={`toggle-btn ${isAnnualView ? 'active' : ''}`}
                    >
                        <BarChart3 size={16} /> Anual
                    </button>
                </div>
            </div>

            {!isAnnualView ? (
                <div className="responsive-layout">
                    
                    {/* Left Column: Management */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* Month Selector & Salary Card */}
                        <div className="card-premium" style={{ borderLeft: '5px solid var(--primary)', padding: '1.25rem' }}>
                            <div className="salary-header">
                                <div className="month-nav">
                                    <button onClick={() => changeMonth(-1)} className="btn-icon small"><ChevronLeft size={18} /></button>
                                    <h3 style={{ margin: 0, textTransform: 'capitalize', fontSize: '1.1rem' }}>
                                        {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button onClick={() => changeMonth(1)} className="btn-icon small"><ChevronRight size={18} /></button>
                                    <button 
                                        onClick={handleCopyPreviousMonth} 
                                        className="btn-icon small" 
                                        title="Copiar gastos del mes anterior"
                                        style={{ marginLeft: '0.5rem', color: 'var(--primary)' }}
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                                <div className="salary-info">
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '800', display: 'block' }}>SUELDO NETO</span>
                                    {isEditingSalary ? (
                                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                                            <input 
                                                type="number" 
                                                value={newSalary} 
                                                onChange={(e) => setNewSalary(e.target.value)}
                                                placeholder={salary}
                                                style={inputSmallStyle}
                                                autoFocus
                                            />
                                            <button onClick={handleSaveSalary} className="btn-primary" style={{ padding: '0.4rem', borderRadius: 'var(--rounded-sm)' }}><CheckCircle2 size={16} /></button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem' }}>${salary.toLocaleString()}</h2>
                                            <button onClick={() => { setIsEditingSalary(true); setNewSalary(salary); }} style={{ color: 'var(--text-muted)', padding: '4px' }}><Edit size={14} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', marginTop: '1.25rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Gastos</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--error)' }}>{expensePercent.toFixed(0)}%</span>
                                    </div>
                                    <div className="progress-bg">
                                        <div className="progress-fill error" style={{ width: `${expensePercent}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>Ahorro</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent)' }}>{savingsPercent.toFixed(0)}%</span>
                                    </div>
                                    <div className="progress-bg">
                                        <div className="progress-fill accent" style={{ width: `${savingsPercent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Add Expense Form */}
                        <div className="card-premium" style={{ padding: '1.25rem' }}>
                            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                <PlusCircle className="text-primary" size={18} /> {editingExpense ? 'Editar Gasto' : 'Cargar Gasto'}
                            </h3>
                            <form onSubmit={handleAddExpense} className="expense-form">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={labelStyle}>Categoría</label>
                                    <input 
                                        type="text" 
                                        value={expenseCategory} 
                                        onChange={(e) => setExpenseCategory(e.target.value)} 
                                        placeholder="Ej: Comida, Alquiler..." 
                                        style={inputStyle}
                                        required 
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={labelStyle}>Monto ($)</label>
                                    <input 
                                        type="number" 
                                        value={expenseAmount} 
                                        onChange={(e) => setExpenseAmount(e.target.value)} 
                                        placeholder="0" 
                                        style={inputStyle}
                                        required 
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.8rem' }}>
                                        {editingExpense ? <CheckCircle2 size={18} /> : <Plus size={18} />} {editingExpense ? 'Guardar' : 'Agregar'}
                                    </button>
                                    {editingExpense && (
                                        <button type="button" onClick={() => { setEditingExpense(null); setExpenseCategory(""); setExpenseAmount(""); }} className="btn-outline" style={{ padding: '0.8rem' }}>
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* List of Expenses */}
                        <div className="card-premium" style={{ padding: '1.25rem' }}>
                            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Detalle de Gastos</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {expenses.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        <PieChart size={40} style={{ marginBottom: '0.75rem', opacity: 0.2 }} />
                                        <p style={{ fontSize: '0.9rem' }}>No hay gastos este mes.</p>
                                    </div>
                                ) : (
                                    expenses.map(exp => (
                                        <div key={exp.id} className="expense-item animate-slide-in" style={{ padding: '0.85rem', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            {/* Item Name Row */}
                                            <div style={{ width: '100%' }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', wordBreak: 'break-word' }}>{exp.category}</h4>
                                            </div>
                                            
                                            {/* Item Meta & Actions Row */}
                                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{new Date(exp.createdAt).toLocaleDateString()}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '900', color: 'var(--text-main)' }}>${exp.amount.toLocaleString()}</h4>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--error)', fontWeight: '800' }}>
                                                            ({salary > 0 ? ((exp.amount / salary) * 100).toFixed(0) : 0}%)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                                    <button 
                                                        onClick={() => handleTogglePaid(exp)} 
                                                        className={`btn-icon small ${exp.paid ? 'active-success' : ''}`}
                                                        title={exp.paid ? "Marcar como pendiente" : "Marcar como pagado"}
                                                    >
                                                        <CheckCircle2 size={14} color={exp.paid ? 'white' : 'var(--text-muted)'} />
                                                    </button>
                                                    <button onClick={() => startEditExpense(exp)} className="btn-icon small"><Edit size={14} /></button>
                                                    <button onClick={() => handleDeleteExpense(exp.id)} className="btn-icon small text-error"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Widgets */}
                    <div className="widgets-column">
                        <div className="card-premium" style={{ 
                            background: excess > 0 
                                ? 'linear-gradient(135deg, var(--error) 0%, #b91c1c 100%)' 
                                : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', 
                            color: 'white', 
                            border: 'none', 
                            padding: '1.5rem' 
                        }}>
                            {excess > 0 ? <AlertCircle size={24} style={{ marginBottom: '0.75rem', opacity: 0.8 }} /> : <DollarSign size={24} style={{ marginBottom: '0.75rem', opacity: 0.8 }} />}
                            <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: '800', textTransform: 'uppercase' }}>
                                {excess > 0 ? 'GASTANDO DE MÁS' : 'DISPONIBLE'}
                            </span>
                            <h2 style={{ fontSize: '2rem', margin: '0.25rem 0', fontWeight: '900' }}>
                                ${excess > 0 ? excess.toLocaleString() : savings.toLocaleString()}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '700' }}>
                                {excess > 0 ? (
                                    <> <TrendingDown size={14} /> Estás excedido por ${excess.toLocaleString()} </>
                                ) : (
                                    <> <TrendingUp size={14} /> {savingsPercent.toFixed(0)}% del sueldo </>
                                )}
                            </div>
                        </div>

                        {/* Category Distribution Chart */}
                        {expenses.length > 0 && (
                            <div className="card-premium animate-fade-in" style={{ padding: '1.25rem' }}>
                                <h4 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                    <PieChart size={16} className="text-primary" /> Distribución
                                </h4>
                                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <svg width="160" height="160" viewBox="0 0 42 42">
                                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-subtle)" strokeWidth="3"></circle>
                                        {(() => {
                                            const total = expenses.reduce((s, e) => s + e.amount, 0);
                                            if (total === 0) return null;
                                            let offset = 0;
                                            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
                                            const grouped = expenses.reduce((acc, exp) => {
                                                const cat = exp.category.toLowerCase().trim();
                                                acc[cat] = (acc[cat] || 0) + exp.amount;
                                                return acc;
                                            }, {});

                                            const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
                                            
                                            return entries.slice(0, 7).map(([cat, amt], i) => {
                                                const percent = (amt / total) * 100;
                                                const dashArray = `${percent} ${100 - percent}`;
                                                const rotation = (offset / 100) * 360 - 90;
                                                offset += percent;
                                                
                                                return (
                                                    <circle 
                                                        key={cat}
                                                        cx="21" cy="21" r="15.915" 
                                                        fill="transparent" 
                                                        stroke={colors[i % colors.length]} 
                                                        strokeWidth="5" 
                                                        strokeDasharray={dashArray} 
                                                        strokeDashoffset="0"
                                                        style={{ 
                                                            transformOrigin: 'center',
                                                            transform: `rotate(${rotation}deg)`,
                                                            transition: 'all 0.5s ease'
                                                        }}
                                                    ></circle>
                                                );
                                            });
                                        })()}
                                    </svg>
                                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '800', display: 'block' }}>TOTAL</span>
                                        <span style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--text-main)' }}>
                                            ${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="distribution-legend" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    {(() => {
                                        const total = expenses.reduce((s, e) => s + e.amount, 0);
                                        const grouped = expenses.reduce((acc, exp) => {
                                            const cat = exp.category.toLowerCase().trim();
                                            acc[cat] = (acc[cat] || 0) + exp.amount;
                                            return acc;
                                        }, {});
                                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
                                        
                                        return Object.entries(grouped)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 6)
                                            .map(([cat, amt], i) => (
                                                <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: colors[i % colors.length], flexShrink: 0 }}></div>
                                                        <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                                                            {cat}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.9rem' }}>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>${amt.toLocaleString()}</span>
                                                        <span style={{ fontWeight: '800', fontSize: '0.7rem', color: 'var(--primary)' }}>
                                                            {((amt / total) * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Annual View */
                <div className="card-premium animate-fade-in" style={{ padding: '1rem' }}>
                    <div className="annual-header">
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Resumen {yearStr}</h2>
                        <div className="year-selector">
                             <button onClick={() => setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)))} className="btn-icon small"><ChevronLeft size={16} /></button>
                             <span style={{ fontWeight: '900', fontSize: '1rem' }}>{yearStr}</span>
                             <button onClick={() => setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)))} className="btn-icon small"><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', margin: '0 -0.5rem', padding: '0 0.5rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', minWidth: '500px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={thStyle}>Mes</th>
                                    <th style={thStyle}>Sueldo</th>
                                    <th style={thStyle}>Gastos</th>
                                    <th style={thStyle}>Saldo</th>
                                    <th style={thStyle}>Ahorro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {annualData.map(m => (
                                    <tr key={m.month} className="table-row-hover" style={{ background: m.salary > 0 ? 'var(--bg-subtle)' : 'transparent', opacity: m.salary > 0 ? 1 : 0.4 }}>
                                        <td style={{ ...tdSmallStyle, borderRadius: 'var(--rounded-md) 0 0 var(--rounded-md)', fontWeight: '800', textTransform: 'capitalize' }}>
                                            {m.monthName.slice(0, 3)}.
                                        </td>
                                        <td style={tdSmallStyle}>${m.salary.toLocaleString()}</td>
                                        <td style={{ ...tdSmallStyle, color: 'var(--error)' }}>-${m.expenses.toLocaleString()}</td>
                                        <td style={{ ...tdSmallStyle, color: m.savings >= 0 ? 'var(--accent)' : 'var(--error)', fontWeight: '800' }}>
                                            ${Math.abs(m.savings).toLocaleString()}
                                        </td>
                                        <td style={{ ...tdSmallStyle, borderRadius: '0 var(--rounded-md) var(--rounded-md) 0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', background: m.savingsPercent > 20 ? 'var(--accent)' : 'var(--primary)', width: `${m.savingsPercent}%` }}></div>
                                                </div>
                                                <span style={{ fontWeight: '900', fontSize: '0.75rem' }}>{m.savingsPercent.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <style jsx>{`
                .btn-icon {
                    background: var(--bg-subtle);
                    border: 1px solid var(--border);
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: grid;
                    place-items: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-icon:hover { background: white; border-color: var(--primary); color: var(--primary); }
                .btn-icon.small { width: 32px; height: 32px; }
                
                .btn-icon.active-success {
                    background: var(--accent) !important;
                    border-color: var(--accent) !important;
                    color: white !important;
                }
                .btn-icon.active-success:hover {
                    filter: brightness(1.1);
                }

                .view-toggle-container {
                    display: flex; 
                    background: var(--bg-subtle); 
                    padding: 0.3rem; 
                    border-radius: var(--rounded-md); 
                    border: 1px solid var(--border);
                }
                .toggle-btn {
                    padding: 0.5rem 1rem; 
                    border-radius: var(--rounded-sm); 
                    font-size: 0.85rem; 
                    font-weight: 800;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: transparent;
                    color: var(--text-muted);
                    transition: all 0.2s ease;
                }
                .toggle-btn.active {
                    background: white;
                    color: var(--primary);
                    box-shadow: var(--shadow-sm);
                }

                .salary-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                }
                .month-nav {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .salary-info {
                    text-align: right;
                }

                .expense-form {
                    display: grid;
                    grid-template-columns: 1fr 120px auto;
                    gap: 1rem;
                    align-items: end;
                }

                .responsive-layout {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 1.5rem;
                }

                .widgets-column {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .annual-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .year-selector {
                    display: flex;
                    gap: 0.5rem;
                    background: var(--bg-subtle);
                    padding: 0.3rem;
                    border-radius: var(--rounded-md);
                    align-items: center;
                }

                .progress-bg { height: 8px; background: var(--border); borderRadius: 4px; overflow: hidden; }
                .progress-fill { height: 100%; transition: width 0.5s ease; }
                .progress-fill.error { background: var(--error); }
                .progress-fill.accent { background: var(--accent); }

                .expense-item {
                    display: flex;
                    align-items: center;
                    background: var(--bg-subtle);
                    border-radius: var(--rounded-md);
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                }
                .expense-item:hover { background: white; border-color: var(--border); box-shadow: var(--shadow-sm); }

                @media (max-width: 900px) {
                    .responsive-layout { grid-template-columns: 1fr !important; }
                    .expense-form { grid-template-columns: 1fr !important; gap: 0.75rem; }
                    .salary-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .salary-info { text-align: left; width: 100%; }
                    .salary-info div { justify-content: flex-start !important; }
                    .title-responsive { font-size: 1.75rem !important; }
                    .card-premium { padding: 1rem !important; }
                }

                @media (max-width: 600px) {
                    .view-toggle-container { width: 100%; }
                    .toggle-btn { flex: 1; justify-content: center; font-size: 0.75rem; }
                    .expense-item { flex-wrap: wrap; gap: 0.5rem; }
                    .expense-item > div:first-child { flex: 1 1 100%; }
                    .expense-item > div:nth-child(2) { text-align: left !important; flex: 1; }
                    .expense-item > div:last-child { justify-content: flex-end; }
                    .distribution-legend { grid-template-columns: 1fr !important; }
                }

                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s infinite;
                }
                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
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
    fontSize: '0.95rem'
};
const inputSmallStyle = { 
    width: '100%', 
    maxWidth: '120px',
    padding: '0.4rem 0.75rem', 
    borderRadius: 'var(--rounded-sm)', 
    border: '2px solid var(--primary)', 
    outline: 'none', 
    fontWeight: '800'
};
const labelStyle = { fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' };
const thStyle = { padding: '0.75rem 0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdSmallStyle = { padding: '0.75rem 0.5rem', fontSize: '0.85rem' };
