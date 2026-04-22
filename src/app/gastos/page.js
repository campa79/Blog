"use client";

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
    CheckCircle2
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

    const fetchAnnualData = async () => {
        setLoading(true);
        const months = [];
        for (let i = 1; i <= 12; i++) {
            const mId = `${yearStr}-${String(i).padStart(2, '0')}`;
            
            // Get Salary
            const mDoc = await getDoc(doc(db, "user_gastos", user.uid, "mensual", mId));
            const mSalary = mDoc.exists() ? mDoc.data().salary : 0;

            // Get Items Total
            const itemsSnap = await getDocs(collection(db, "user_gastos", user.uid, "mensual", mId, "items"));
            const mExpenses = itemsSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

            months.push({
                month: i,
                monthName: new Date(2024, i - 1).toLocaleString('es-ES', { month: 'long' }),
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

        const itemsRef = collection(db, "user_gastos", user.uid, "mensual", monthId, "items");
        
        if (editingExpense) {
            await updateDoc(doc(itemsRef, editingExpense.id), {
                category: expenseCategory,
                amount: Number(expenseAmount),
                updatedAt: new Date().toISOString()
            });
            setEditingExpense(null);
        } else {
            await addDoc(itemsRef, {
                category: expenseCategory,
                amount: Number(expenseAmount),
                createdAt: new Date().toISOString()
            });
        }

        setExpenseCategory("");
        setExpenseAmount("");
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
    const expensePercent = salary > 0 ? Math.min(100, (totalExpenses / salary) * 100) : 0;
    const savingsPercent = salary > 0 ? Math.max(0, (savings / salary) * 100) : 0;

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            
            {/* Header & View Toggle */}
            <div style={{ marginBottom: "3rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: "2.5rem", color: "var(--text-main)", display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Wallet className="text-primary" size={40} /> Mis Gastos
                    </h1>
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>Gestioná tu economía personal de forma privada.</p>
                </div>
                
                <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.4rem', borderRadius: 'var(--rounded-md)', border: '1px solid var(--border)' }}>
                    <button 
                        onClick={() => setIsAnnualView(false)}
                        style={{ 
                            padding: '0.6rem 1.25rem', 
                            borderRadius: 'var(--rounded-sm)', 
                            fontSize: '0.9rem', 
                            fontWeight: '700',
                            background: !isAnnualView ? 'white' : 'transparent',
                            color: !isAnnualView ? 'var(--primary)' : 'var(--text-muted)',
                            boxShadow: !isAnnualView ? 'var(--shadow-sm)' : 'none',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Calendar size={18} /> Mensual
                    </button>
                    <button 
                        onClick={() => setIsAnnualView(true)}
                        style={{ 
                            padding: '0.6rem 1.25rem', 
                            borderRadius: 'var(--rounded-sm)', 
                            fontSize: '0.9rem', 
                            fontWeight: '700',
                            background: isAnnualView ? 'white' : 'transparent',
                            color: isAnnualView ? 'var(--primary)' : 'var(--text-muted)',
                            boxShadow: isAnnualView ? 'var(--shadow-sm)' : 'none',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <BarChart3 size={18} /> Anual
                    </button>
                </div>
            </div>

            {!isAnnualView ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }} className="responsive-layout">
                    
                    {/* Left Column: Management */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* Month Selector & Salary Card */}
                        <div className="card-premium" style={{ borderLeft: '5px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <button onClick={() => changeMonth(-1)} className="btn-icon"><ChevronLeft /></button>
                                    <h3 style={{ margin: 0, textTransform: 'capitalize', minWidth: '150px', textAlign: 'center' }}>
                                        {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button onClick={() => changeMonth(1)} className="btn-icon"><ChevronRight /></button>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block' }}>SUELDO NETO</span>
                                    {isEditingSalary ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <input 
                                                type="number" 
                                                value={newSalary} 
                                                onChange={(e) => setNewSalary(e.target.value)}
                                                placeholder={salary}
                                                style={inputSmallStyle}
                                                autoFocus
                                            />
                                            <button onClick={handleSaveSalary} className="btn-primary" style={{ padding: '0.4rem' }}><CheckCircle2 size={18} /></button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                            <h2 style={{ margin: 0, color: 'var(--text-main)' }}>${salary.toLocaleString()}</h2>
                                            <button onClick={() => { setIsEditingSalary(true); setNewSalary(salary); }} style={{ color: 'var(--text-muted)' }}><Edit size={16} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Gastos</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--error)' }}>{expensePercent.toFixed(1)}%</span>
                                    </div>
                                    <div className="progress-bg">
                                        <div className="progress-fill error" style={{ width: `${expensePercent}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Ahorro</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent)' }}>{savingsPercent.toFixed(1)}%</span>
                                    </div>
                                    <div className="progress-bg">
                                        <div className="progress-fill accent" style={{ width: `${savingsPercent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Add Expense Form */}
                        <div className="card-premium">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <PlusCircle className="text-primary" size={20} /> {editingExpense ? 'Editar Gasto' : 'Cargar Gasto'}
                            </h3>
                            <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: '1rem', alignItems: 'end' }} className="expense-form">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={labelStyle}>Categoría</label>
                                    <input 
                                        type="text" 
                                        value={expenseCategory} 
                                        onChange={(e) => setExpenseCategory(e.target.value)} 
                                        placeholder="Ej: Comida, Alquiler, Gimnasio..." 
                                        style={inputStyle}
                                        required 
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                                <button type="submit" className="btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
                                    {editingExpense ? <CheckCircle2 /> : <Plus />} {editingExpense ? 'Guardar' : 'Agregar'}
                                </button>
                                {editingExpense && (
                                    <button type="button" onClick={() => { setEditingExpense(null); setExpenseCategory(""); setExpenseAmount(""); }} className="btn-outline" style={{ padding: '0.85rem' }}>
                                        Cancelar
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* List of Expenses */}
                        <div className="card-premium">
                            <h3 style={{ marginBottom: '1.5rem' }}>Detalle de Gastos ({expenses.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {expenses.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <PieChart size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                        <p>No hay gastos registrados en este mes.</p>
                                    </div>
                                ) : (
                                    expenses.map(exp => (
                                        <div key={exp.id} className="expense-item">
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{exp.category}</h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(exp.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                                                <h4 style={{ margin: 0, color: 'var(--text-main)' }}>${exp.amount.toLocaleString()}</h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: '700' }}>
                                                    {salary > 0 ? ((exp.amount / salary) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button onClick={() => startEditExpense(exp)} className="btn-icon small"><Edit size={14} /></button>
                                                <button onClick={() => handleDeleteExpense(exp.id)} className="btn-icon small text-error"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Widgets */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card-premium glass" style={{ background: 'var(--primary)', color: 'white' }}>
                            <DollarSign size={32} style={{ marginBottom: '1rem', opacity: 0.8 }} />
                            <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: '700' }}>DISPONIBLE PARA AHORRO</span>
                            <h2 style={{ fontSize: '2rem', margin: '0.5rem 0' }}>${savings.toLocaleString()}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700' }}>
                                <TrendingUp size={16} /> {savingsPercent.toFixed(1)}% del sueldo
                            </div>
                        </div>

                        <div className="card-premium">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL GASTADO</span>
                            <h2 style={{ fontSize: '1.75rem', margin: '0.5rem 0', color: 'var(--error)' }}>${totalExpenses.toLocaleString()}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                                <TrendingDown size={16} /> {expensePercent.toFixed(1)}% del sueldo
                            </div>
                        </div>

                        <div className="card-premium" style={{ background: 'var(--bg-subtle)' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Consejo Financiero</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                                {savingsPercent > 20 ? 
                                    "¡Excelente! Estás ahorrando más del 20% de tus ingresos. Seguí así." : 
                                    "Intentá reducir gastos hormiga para alcanzar un ahorro mensual del 15% al 20%."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Annual View */
                <div className="card-premium animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0 }}>Resumen Anual {yearStr}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <button onClick={() => setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() - 1)))} className="btn-icon"><ChevronLeft /></button>
                             <span style={{ fontWeight: '800', fontSize: '1.2rem', padding: '0 1rem' }}>{yearStr}</span>
                             <button onClick={() => setCurrentDate(new Date(currentDate.setFullYear(currentDate.getFullYear() + 1)))} className="btn-icon"><ChevronRight /></button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                    <th style={thStyle}>Mes</th>
                                    <th style={thStyle}>Sueldo Neto</th>
                                    <th style={thStyle}>Gastos Totales</th>
                                    <th style={thStyle}>Ahorro</th>
                                    <th style={thStyle}>% Ahorro</th>
                                </tr>
                            </thead>
                            <tbody>
                                {annualData.map(m => (
                                    <tr key={m.month} style={{ borderBottom: '1px solid var(--border)', background: m.salary > 0 ? 'transparent' : 'var(--bg-subtle)', opacity: m.salary > 0 ? 1 : 0.5 }}>
                                        <td style={tdStyle}><strong>{m.monthName}</strong></td>
                                        <td style={tdStyle}>${m.salary.toLocaleString()}</td>
                                        <td style={tdStyle}><span style={{ color: 'var(--error)' }}>-${m.expenses.toLocaleString()}</span></td>
                                        <td style={tdStyle}><span style={{ color: 'var(--accent)', fontWeight: '700' }}>${m.savings.toLocaleString()}</span></td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', minWidth: '60px' }}>
                                                    <div style={{ height: '100%', background: 'var(--accent)', width: `${m.savingsPercent}%` }}></div>
                                                </div>
                                                <span style={{ fontWeight: '700' }}>{m.savingsPercent.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '800' }}>
                                    <td style={tdStyle}>TOTAL ANUAL</td>
                                    <td style={tdStyle}>${annualData.reduce((s, m) => s + m.salary, 0).toLocaleString()}</td>
                                    <td style={tdStyle}>${annualData.reduce((s, m) => s + m.expenses, 0).toLocaleString()}</td>
                                    <td style={tdStyle}>${annualData.reduce((s, m) => s + m.savings, 0).toLocaleString()}</td>
                                    <td style={tdStyle}>
                                        Promedio: {(annualData.reduce((s, m) => s + m.savingsPercent, 0) / 12).toFixed(1)}%
                                    </td>
                                </tr>
                            </tfoot>
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
                .btn-icon.small { width: 30px; height: 30px; }
                .text-error { color: var(--error); }
                
                .progress-bg { height: 10px; background: var(--border); borderRadius: 5px; overflow: hidden; }
                .progress-fill { height: 100%; transition: width 0.5s ease; }
                .progress-fill.error { background: var(--error); }
                .progress-fill.accent { background: var(--accent); }

                .expense-item {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    background: var(--bg-subtle);
                    border-radius: var(--rounded-md);
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                }
                .expense-item:hover { background: white; border-color: var(--border); box-shadow: var(--shadow-sm); }

                @media (max-width: 900px) {
                    .responsive-layout { grid-template-columns: 1fr !important; }
                    .expense-form { grid-template-columns: 1fr !important; }
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
    padding: '0.85rem', 
    borderRadius: 'var(--rounded-md)', 
    border: '1px solid var(--border)', 
    outline: 'none', 
    fontFamily: 'inherit',
    fontSize: '0.95rem'
};
const inputSmallStyle = { 
    width: '120px', 
    padding: '0.4rem 0.75rem', 
    borderRadius: 'var(--rounded-sm)', 
    border: '2px solid var(--primary)', 
    outline: 'none', 
    fontWeight: '700'
};
const labelStyle = { fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' };
const thStyle = { padding: '1.25rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '1.25rem 1rem', fontSize: '0.95rem' };
