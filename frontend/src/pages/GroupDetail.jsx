import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../api';
import { useAuth } from '../AuthContext';
import AddExpenseModal from '../components/AddExpenseModal';

const CHART_COLORS = ['#3f6b52', '#b0503a', '#b8944f', '#5b7fa6', '#8a6bb0', '#6b6558'];

const TABS = ['expenses', 'balances', 'settle', 'insights'];

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [tab, setTab] = useState('expenses');
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const deleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense? This will recalculate balances for everyone.')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete expense');
    }
  };

  if (loading || !group) {
    return <div className="page"><p className="loading-text">Loading group…</p></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{group.name}</h1>
          <p className="page-sub">{group.members.map((m) => m.name).join(', ')}</p>
        </div>
        <button className="btn btn-sage" onClick={() => setShowAddExpense(true)}>+ Add expense</button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'settle' ? 'Settle up' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <div className="expense-list">
          {expenses.length === 0 ? (
            <div className="empty-state">No expenses logged yet. Add the first one.</div>
          ) : (
            expenses.map((exp) => (
              <div className="expense-row" key={exp._id}>
                <div className="expense-main">
                  <span className="expense-desc">{exp.description}</span>
                  <span className="expense-meta">
                    Paid by {exp.paidBy?.name} · split {exp.splitBetween.length} ways · {new Date(exp.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="expense-amount">
                  <span className="category-chip">{exp.category}</span>
                  ₹{exp.amount.toFixed(2)}
                  {exp.createdBy === user?._id || exp.createdBy?._id === user?._id ? (
                    <button className="btn-danger-text" onClick={() => deleteExpense(exp._id)}>Delete</button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'balances' && (
        <div>
          <p className="section-label">Net balance per member</p>
          <div className="balance-list">
            {balances.map((b) => (
              <div className="balance-row" key={b.userId}>
                <span className="balance-name">{b.name}</span>
                <span>
                  <span className={`balance-amount ${b.amount > 0.01 ? 'positive' : b.amount < -0.01 ? 'negative' : 'zero'}`}>
                    ₹{Math.abs(b.amount).toFixed(2)}
                  </span>
                  <span className={`balance-tag ${b.amount >= 0 ? 'positive' : 'negative'}`}>
                    {b.amount > 0.01 ? 'gets back' : b.amount < -0.01 ? 'owes' : 'settled'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settle' && (
        <div>
          <p className="section-label">
            Minimum transactions to settle everyone up ({transactions.length} transaction{transactions.length !== 1 ? 's' : ''})
          </p>
          {transactions.length === 0 ? (
            <div className="empty-state">Everyone is settled up. Nothing to pay.</div>
          ) : (
            <div className="transaction-list">
              {transactions.map((t, idx) => (
                <div className="transaction-row" key={idx}>
                  <span>{t.fromName}</span>
                  <span className="transaction-arrow">→ pays →</span>
                  <span>{t.toName}</span>
                  <span className="transaction-amount">₹{t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'insights' && insights && (
        <div>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total group spend</div>
              <div className="stat-value">₹{insights.totalSpent.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Expenses logged</div>
              <div className="stat-value">{expenses.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Members</div>
              <div className="stat-value">{group.members.length}</div>
            </div>
          </div>

          {insights.categoryBreakdown.length > 0 && (
            <div className="chart-card">
              <p className="section-label">Spending by category</p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={insights.categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {insights.categoryBreakdown.map((entry, idx) => (
                      <Cell key={entry.category} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {insights.monthlyBreakdown.length > 0 && (
            <div className="chart-card">
              <p className="section-label">Spending by month</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={insights.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2ddd0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                  <Bar dataKey="total" fill="#3f6b52" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
            loadAll();
          }}
        />
      )}
    </div>
  );
}
