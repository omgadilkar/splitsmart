import React, { useState, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const CATEGORIES = [
  { id: 'food', label: '🍕 Food & Drink' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'stay', label: '🏠 Stay' },
  { id: 'utilities', label: '💡 Utilities' },
  { id: 'shopping', label: '🛍️ Shopping' },
  { id: 'entertainment', label: '🎫 Entertainment' },
  { id: 'other', label: '📦 Other' },
];

export default function AddExpenseModal({ group, onClose, onAdded }) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [paidBy, setPaidBy] = useState(user?._id || group.members[0]._id);
  const [splitType, setSplitType] = useState('equal');
  const [participants, setParticipants] = useState(group.members.map((m) => m._id));
  const [customShares, setCustomShares] = useState(
    Object.fromEntries(group.members.map((m) => [m._id, '']))
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const toggleParticipant = (memberId) => {
    setParticipants((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const parsedAmount = Number(amount) || 0;
  
  const equalShare = useMemo(() => {
    if (!parsedAmount || participants.length === 0) return 0;
    return (parsedAmount / participants.length).toFixed(2);
  }, [parsedAmount, participants.length]);

  const customAllocated = useMemo(() => {
    return Object.values(customShares).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [customShares]);
  
  const customRemaining = parsedAmount - customAllocated;
  const isCustomValid = Math.abs(customRemaining) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim() || parsedAmount <= 0) {
      setError('Enter a valid description and amount');
      return;
    }

    let payload = {
      groupId: group._id,
      description,
      amount: parsedAmount,
      category,
      paidBy,
      splitType,
    };

    if (splitType === 'equal') {
      if (participants.length === 0) {
        setError('Select at least one participant to split with');
        return;
      }
      payload.splitBetween = participants.map((id) => ({ user: id, share: 0 }));
    } else {
      const shares = Object.entries(customShares)
        .filter(([, val]) => val !== '' && Number(val) > 0)
        .map(([userId, val]) => ({ user: userId, share: Number(val) }));

      if (shares.length === 0) {
        setError('Enter at least one custom share');
        return;
      }
      if (!isCustomValid) {
        setError(`Shares add up to ₹${customAllocated.toFixed(2)}, but the total is ₹${parsedAmount.toFixed(2)}`);
        return;
      }
      payload.splitBetween = shares;
    }

    setLoading(true);
    try {
      await api.post('/expenses', payload);
      onAdded();
    } catch (err) {
      setError('Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: '500px' }}>
        <h2 className="modal-title">New expense</h2>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="description">1. What was it?</label>
            <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Dinner at the beach shack" required autoFocus disabled={loading} />
          </div>

          <div className="field">
            <label htmlFor="amount">2. Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>₹</span>
              <input id="amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required disabled={loading} style={{ paddingLeft: '2rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="category">3. Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="paidBy">4. Paid by</label>
              <select id="paidBy" value={paidBy} onChange={(e) => setPaidBy(e.target.value)} disabled={loading}>
                {group.members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>5. Split method</label>
            <div className="tabs" style={{ marginBottom: '1rem' }}>
              <button type="button" className={`tab ${splitType === 'equal' ? 'active' : ''}`} onClick={() => setSplitType('equal')}>Equally</button>
              <button type="button" className={`tab ${splitType === 'custom' ? 'active' : ''}`} onClick={() => setSplitType('custom')}>Custom</button>
            </div>
          </div>

          <div className="field">
            <label>6. Participants</label>
            
            {splitType === 'equal' ? (
              <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  {group.members.map((m) => (
                    <div className="checkbox-row" key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={participants.includes(m._id)}
                        onChange={() => toggleParticipant(m._id)}
                        id={`p-${m._id}`}
                        disabled={loading}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <label htmlFor={`p-${m._id}`} style={{ fontWeight: 500, margin: 0 }}>{m.name}</label>
                    </div>
                  ))}
                </div>
                
                {parsedAmount > 0 && participants.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="small-text">₹{parsedAmount} / {participants.length} people</span>
                    <span className="financial-number">₹{equalShare} each</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {group.members.map((m) => (
                    <div className="split-row" key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                      <div style={{ position: 'relative', width: '120px' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customShares[m._id]}
                          onChange={(e) => setCustomShares({ ...customShares, [m._id]: e.target.value })}
                          placeholder="0.00"
                          disabled={loading}
                          style={{ paddingLeft: '1.75rem', paddingRight: '0.5rem', textAlign: 'right', marginBottom: 0 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="small-text">Allocated</span>
                    <span style={{ fontWeight: 500 }}>₹{customAllocated.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="small-text">Remaining</span>
                    <span style={{ fontWeight: 600, color: customRemaining === 0 ? 'var(--positive)' : 'var(--danger)' }}>
                      ₹{Math.abs(customRemaining).toFixed(2)} {customRemaining === 0 ? '✓' : (customRemaining > 0 ? 'left' : 'over')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !parsedAmount || (splitType === 'custom' && !isCustomValid) || (splitType === 'equal' && participants.length === 0)}>
              {loading ? 'Adding…' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
