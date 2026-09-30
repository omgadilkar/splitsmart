import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import AddExpenseModal from '../components/AddExpenseModal';

const CHART_COLORS = ['#3f6b52', '#b0503a', '#b8944f', '#5b7fa6', '#8a6bb0', '#6b6558'];

const TABS = ['overview', 'expenses', 'balances', 'settle', 'insights'];

const CATEGORY_ICONS = {
  food: '🍕',
  travel: '✈️',
  stay: '🏠',
  utilities: '💡',
  shopping: '🛍️',
  entertainment: '🎫',
  other: '📦',
};

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [explainUserId, setExplainUserId] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setExpenseToDelete(null);
        setExplainUserId(null);
        setShowAddMember(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [groupRes, expensesRes, balancesRes, settleRes, insightsRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/expenses/group/${id}`),
        api.get(`/expenses/group/${id}/balances`),
        api.get(`/expenses/group/${id}/settle`),
        api.get(`/expenses/group/${id}/insights`),
      ]);
      setGroup(groupRes.data.group);
      setExpenses(expensesRes.data.expenses);
      setBalances(balancesRes.data.balances);
      setTransactions(settleRes.data.transactions);
      setInsights(insightsRes.data);
    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await api.delete(`/expenses/${expenseToDelete._id}`);
      setExpenseToDelete(null);
      addToast('Expense deleted successfully!');
      loadAll();
    } catch (err) {
      addToast('Something went wrong.', 'error');
    }
  };

  if (loading || (!group && !error)) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: '40px', width: '200px', marginBottom: '16px' }}></div>
        <div className="skeleton" style={{ height: '24px', width: '150px', marginBottom: '32px' }}></div>
        <div className="skeleton" style={{ height: '48px', marginBottom: '32px' }}></div>
        <div className="skeleton" style={{ height: '200px' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
        <button className="btn btn-primary" onClick={loadAll}>Try again</button>
      </div>
    );
  }

  const userBalance = balances.find(b => b.userId === user?._id)?.amount || 0;
  const explainUser = explainUserId ? balances.find(b => b.userId === explainUserId) : null;
  const explainExpenses = explainUserId ? expenses.filter(e => 
    e.paidBy?._id === explainUserId || 
    e.splitBetween.some(s => s.user?._id === explainUserId)
  ) : [];

  return (
    <div className="page">
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1.5rem', fontWeight: 500 }}>
        <span>←</span> Back to groups
      </Link>

      <div className="page-header" style={{ marginBottom: '2rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{group.name}</h1>
          <p className="page-sub">{group.members.length} members · {expenses.length} expenses</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setShowAddMember(true)}>+ Add member</button>
          <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>+ Add expense</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'settle' ? 'Settle up' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-label">Total spent</div>
            <div className="stat-value">₹{insights?.totalSpent.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Your balance</div>
            <div className="stat-value" style={{ color: userBalance > 0.01 ? 'var(--positive)' : (userBalance < -0.01 ? 'var(--danger)' : 'var(--text-primary)') }}>
              {userBalance > 0.01 ? '+' : ''}₹{userBalance.toFixed(2)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Members</div>
            <div className="stat-value">{group.members.length}</div>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="expense-timeline">
          {expenses.length === 0 ? (
            <div className="empty-state">No expenses logged yet. Add the first one.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {expenses.map((exp) => (
                <div className="expense-row" key={exp._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.5rem', background: 'var(--bg-color)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                      {CATEGORY_ICONS[exp.category] || '📦'}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{exp.description}</h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Paid by <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{exp.paidBy?.name}</span> • Split between {exp.splitBetween.length} • {new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div className="financial-number" style={{ fontSize: '1.125rem' }}>₹{exp.amount.toFixed(2)}</div>
                    {(exp.createdBy === user?._id || exp.createdBy?._id === user?._id) && (
                      <button className="btn-danger-text" onClick={() => setExpenseToDelete(exp)} style={{ padding: 0, fontSize: '0.75rem' }}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'balances' && (
        <div>
          <div className="balance-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {balances.map((b) => (
              <div className="balance-row" key={b.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1.125rem' }}>{b.name.charAt(0).toUpperCase()}</div>
                  <span className="balance-name" style={{ fontWeight: 600, fontSize: '1rem' }}>{b.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="financial-number" style={{ color: b.amount > 0.01 ? 'var(--positive)' : (b.amount < -0.01 ? 'var(--danger)' : 'var(--text-primary)'), fontSize: '1.125rem' }}>
                      ₹{Math.abs(b.amount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      {b.amount > 0.01 ? 'gets back' : b.amount < -0.01 ? 'owes' : 'settled'}
                    </div>
                  </div>
                  <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => setExplainUserId(b.userId)}>Why?</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settle' && (
        <div className="settlement-center">
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Smart Settlement</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
              Turn multiple IOUs into a simpler payment plan.
            </p>
          </div>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--positive)' }}>✓</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Everyone is settled up</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No transfers needed right now.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 className="section-title">Recommended transfers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {transactions.map((t, idx) => (
                    <div key={idx} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>{t.fromName}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>↓</span>
                          <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>{t.toName}</span>
                        </div>
                        <div className="financial-number" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                          ₹{t.amount.toFixed(2)}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem 1rem' }}
                          onClick={async () => {
                            if (!window.confirm(`Mark ₹${t.amount.toFixed(2)} from ${t.fromName} to ${t.toName} as settled?`)) return;
                            try {
                              await api.post('/expenses', {
                                groupId: id,
                                description: `Settlement: ${t.fromName} paid ${t.toName}`,
                                amount: t.amount,
                                category: 'other',
                                paidBy: t.from,
                                splitType: 'custom',
                                splitBetween: [{ user: t.to, share: t.amount }]
                              });
                              addToast('Settlement recorded successfully!');
                              loadAll();
                            } catch (err) {
                              addToast('Failed to mark as settled', 'error');
                            }
                          }}
                        >
                          Mark as settled
                        </button>
                        {t.from === user?._id && (
                          <button 
                            className="btn-danger-text" 
                            style={{ padding: 0, fontSize: '0.875rem' }}
                            onClick={() => setExplainUserId(user._id)}
                          >
                            Why do I owe this?
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>Summary</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>People who owe</span>
                    <span style={{ fontWeight: 600 }}>{balances.filter(b => b.amount < -0.01).length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>People who are owed</span>
                    <span style={{ fontWeight: 600 }}>{balances.filter(b => b.amount > 0.01).length}</span>
                  </div>
                  
                  {(() => {
                    const naiveGraph = {};
                    expenses.forEach(e => {
                      const payer = e.paidBy?._id;
                      if (!payer || e.description.startsWith('Settlement:')) return;
                      e.splitBetween.forEach(s => {
                        const borrower = s.user?._id;
                        if (!borrower || borrower === payer) return;
                        const key = `${borrower}->${payer}`;
                        naiveGraph[key] = (naiveGraph[key] || 0) + s.share;
                      });
                    });
                    const naiveCount = Object.values(naiveGraph).filter(a => a > 0.01).length;
                    
                    return naiveCount > 0 ? (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Before (raw debts)</span>
                          <span style={{ fontWeight: 600 }}>{naiveCount} relationships</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>After (smart routing)</span>
                          <span style={{ fontWeight: 600, color: 'var(--positive)' }}>{transactions.length} transfers</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>How SplitSmart calculated this</h4>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Smart settlement reduces unnecessary transfers by matching net debtors and creditors.
                  </p>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Calculate each member's net balance.</li>
                    <li>Separate debtors and creditors.</li>
                    <li>Match large outstanding balances.</li>
                    <li>Create settlement transfers.</li>
                    <li>Repeat until balances are resolved.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'insights' && (
        <div className="insights-center">
          {expenses.length === 0 || !insights ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>📊</div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Not enough spending data yet</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Log some expenses to see category breakdowns, monthly trends, and smart spending insights.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total spent</div>
                  <div className="financial-number" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>₹{insights.totalSpent.toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Expense count</div>
                  <div className="financial-number" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{expenses.length}</div>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Members</div>
                  <div className="financial-number" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{group.members.length}</div>
                </div>
              </div>

              {(() => {
                const observations = [];
                if (insights.categoryBreakdown.length > 0) {
                  const sortedCat = [...insights.categoryBreakdown].sort((a, b) => b.total - a.total);
                  const topCat = sortedCat[0];
                  const icon = CATEGORY_ICONS[topCat.category] || '📦';
                  const catName = topCat.category.charAt(0).toUpperCase() + topCat.category.slice(1);
                  observations.push(`${icon} ${catName} is your largest spending category at ₹${topCat.total.toFixed(2)}.`);
                }
                if (insights.monthlyBreakdown.length > 0) {
                  const sortedMonths = [...insights.monthlyBreakdown].sort((a, b) => a.month.localeCompare(b.month));
                  const currentMonth = sortedMonths[sortedMonths.length - 1];
                  const monthName = new Date(currentMonth.month + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                  observations.push(`${monthName} spending was ₹${currentMonth.total.toFixed(2)}.`);
                  
                  if (sortedMonths.length > 1) {
                    const prevMonth = sortedMonths[sortedMonths.length - 2];
                    const diff = currentMonth.total - prevMonth.total;
                    if (diff > 0.01) {
                      observations.push(`Spending increased by ₹${diff.toFixed(2)} compared to the previous month.`);
                    } else if (diff < -0.01) {
                      observations.push(`Spending decreased by ₹${Math.abs(diff).toFixed(2)} compared to the previous month.`);
                    }
                  }
                }
                
                return observations.length > 0 ? (
                  <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem' }}>Key Observations</h3>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {observations.map((obs, idx) => (
                        <li key={idx} style={{ marginBottom: '0.5rem' }}>{obs}</li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {insights.categoryBreakdown.length > 0 && (
                  <div className="chart-card" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <p className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 600 }}>Spending by category</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={insights.categoryBreakdown}
                          dataKey="total"
                          nameKey="category"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={2}
                          label={({ name, percent }) => `${name.charAt(0).toUpperCase() + name.slice(1)} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {insights.categoryBreakdown.map((entry, idx) => (
                            <Cell key={entry.category} fill={CHART_COLORS[idx % CHART_COLORS.length]} aria-label={`Category ${entry.category}`} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {insights.monthlyBreakdown.length > 0 && (
                  <div className="chart-card" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <p className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 600 }}>Monthly trend</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={insights.monthlyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(val) => {
                            const d = new Date(val + '-01');
                            return d.toLocaleDateString(undefined, { month: 'short' });
                          }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} 
                          axisLine={false} 
                          tickLine={false} 
                          tickFormatter={(val) => `₹${val}`} 
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
                          formatter={(value) => `₹${value.toFixed(2)}`} 
                          labelFormatter={(label) => new Date(label + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        />
                        <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} aria-label="Monthly spending total" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddExpense && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowAddExpense(false)}
          onAdded={() => {
            setShowAddExpense(false);
            addToast('Expense added successfully!');
            loadAll();
          }}
        />
      )}

      {expenseToDelete && (
        <div className="modal-backdrop" onClick={() => setExpenseToDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: '400px' }}>
            <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Delete this expense?</h2>
            <p className="body-text" style={{ marginBottom: '2rem' }}>
              Are you sure you want to delete "<strong>{expenseToDelete.description}</strong>"? Balances will be recalculated for everyone. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setExpenseToDelete(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }} onClick={confirmDelete}>Delete expense</button>
            </div>
          </div>
        </div>
      )}

      {explainUserId && explainUser && (
        <div className="modal-backdrop" onClick={() => setExplainUserId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{explainUser.name}'s balance</h2>
              <button onClick={() => setExplainUserId(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>×</button>
            </div>
            
            <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>Current net balance</span>
              <div style={{ textAlign: 'right' }}>
                <div className="financial-number" style={{ color: explainUser.amount > 0.01 ? 'var(--positive)' : (explainUser.amount < -0.01 ? 'var(--danger)' : 'var(--text-primary)') }}>
                  ₹{Math.abs(explainUser.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {explainUser.amount > 0.01 ? 'gets back' : explainUser.amount < -0.01 ? 'owes' : 'settled'}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Contributions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {explainExpenses.length === 0 ? (
                <p className="body-text">No expenses found for this user.</p>
              ) : (
                explainExpenses.map(exp => {
                  const paidByThisUser = exp.paidBy?._id === explainUserId;
                  const shareObj = exp.splitBetween.find(s => s.user?._id === explainUserId);
                  const shareAmount = shareObj ? shareObj.share : 0;
                  
                  const impact = (paidByThisUser ? exp.amount : 0) - shareAmount;
                  
                  return (
                    <div key={exp._id} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 500 }}>{exp.description}</span>
                        <span style={{ color: impact > 0.01 ? 'var(--positive)' : (impact < -0.01 ? 'var(--danger)' : 'var(--text-secondary)'), fontWeight: 600 }}>
                          {impact > 0.01 ? '+' : ''}₹{impact.toFixed(2)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Paid {paidByThisUser ? `₹${exp.amount.toFixed(2)}` : '₹0.00'}</span>
                        <span>Share -₹{shareAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {showAddMember && (
        <AddMemberModal
          group={group}
          onClose={() => setShowAddMember(false)}
          onAdded={() => {
            setShowAddMember(false);
            addToast('Member added successfully!');
            loadAll();
          }}
        />
      )}
    </div>
  );
}

function AddMemberModal({ group, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const searchRes = await api.get(`/auth/search?email=${encodeURIComponent(email.trim())}`);
      const userId = searchRes.data.user._id;
      
      if (group.members.some(m => m._id === userId)) {
        setError('That person is already in the group.');
        setLoading(false);
        return;
      }
      
      await api.post(`/groups/${group._id}/members`, { userId });
      onAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'User not found.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="modal-title">Add member</h2>
        
        {error && <div className="error-banner">{error}</div>}
        
        <form onSubmit={handleAdd}>
          <div className="field">
            <label htmlFor="memberEmail">User email address</label>
            <input 
              id="memberEmail"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="friend@example.com" 
              required 
              disabled={loading}
              autoFocus
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !email.trim()}>
              {loading ? 'Adding...' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
