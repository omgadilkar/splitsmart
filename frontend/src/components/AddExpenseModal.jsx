import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const CATEGORIES = ['food', 'travel', 'stay', 'utilities', 'shopping', 'entertainment', 'other'];

export default function AddExpenseModal({ group, onClose, onAdded }) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [paidBy, setPaidBy] = useState(user?._id || group.members[0]._id);
  const [splitType, setSplitType] = useState('equal');
  const [participants, setParticipants] = useState(group.members.map((m) => m._id)); // for equal split
  const [customShares, setCustomShares] = useState(
    Object.fromEntries(group.members.map((m) => [m._id, '']))
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleParticipant = (memberId) => {
    setParticipants((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim() || !amount || Number(amount) <= 0) {
      setError('Enter a valid description and amount');
      return;
    }

    let payload = {
      groupId: group._id,
      description,
      amount: Number(amount),
      category,
      paidBy,
      splitType,
    };

    if (splitType === 'equal') {
      if (participants.length === 0) {
        setError('Select at least one participant to split with');
        return;
      }
      payload.splitBetween = participants.map((id) => ({ user: id, share: 0 })); // share ignored server-side for equal, recalculated
    } else {
      const shares = Object.entries(customShares)
        .filter(([, val]) => val !== '' && Number(val) > 0)
        .map(([userId, val]) => ({ user: userId, share: Number(val) }));

      if (shares.length === 0) {
        setError('Enter at least one custom share');
        return;
      }
      const total = shares.reduce((sum, s) => sum + s.share, 0);
      if (Math.abs(total - Number(amount)) > 0.01) {
        setError(`Shares add up to ₹${total.toFixed(2)}, but the total is ₹${Number(amount).toFixed(2)}`);
        return;
      }
      payload.splitBetween = shares;
    }

    setLoading(true);
    try {
      await api.post('/expenses', payload);
      onAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add expense</h2>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Dinner at the beach shack" required />
          </div>

          <div className="field">
            <label>Amount (₹)</label>
            <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>

          <div className="field">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Paid by</label>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              {group.members.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Split type</label>
            <select value={splitType} onChange={(e) => setSplitType(e.target.value)}>
              <option value="equal">Split equally</option>
              <option value="custom">Custom amounts</option>
            </select>
          </div>

          {splitType === 'equal' ? (
            <div className="field">
              <label>Split between</label>
              {group.members.map((m) => (
                <div className="checkbox-row" key={m._id}>
                  <input
                    type="checkbox"
                    checked={participants.includes(m._id)}
                    onChange={() => toggleParticipant(m._id)}
                    id={`p-${m._id}`}
                  />
                  <label htmlFor={`p-${m._id}`}>{m.name}</label>
                </div>
              ))}
            </div>
          ) : (
            <div className="field">
              <label>Custom share per person (₹)</label>
              {group.members.map((m) => (
                <div className="split-row" key={m._id}>
                  <span>{m.name}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customShares[m._id]}
                    onChange={(e) => setCustomShares({ ...customShares, [m._id]: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-sage" disabled={loading}>
              {loading ? 'Adding…' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
