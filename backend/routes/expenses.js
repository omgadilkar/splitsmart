const express = require('express');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const simplifyDebts = require('../utils/simplifyDebts');

const router = express.Router();

async function assertMember(groupId, userId) {
  const group = await Group.findById(groupId).populate('members', 'name email');
  if (!group) {
    const err = new Error('Group not found');
    err.status = 404;
    throw err;
  }
  const isMember = group.members.some((m) => m._id.toString() === userId);
  if (!isMember) {
    const err = new Error('You are not a member of this group');
    err.status = 403;
    throw err;
  }
  return group;
}

// @route POST /api/expenses
// Body: { groupId, description, amount, category, paidBy, splitType: 'equal' | 'custom', splitBetween? }
router.post('/', auth, async (req, res) => {
  try {
    const { groupId, description, amount, category, paidBy, splitType, splitBetween } = req.body;

    if (!groupId || !description || !amount || !paidBy) {
      return res.status(400).json({ message: 'groupId, description, amount and paidBy are required' });
    }

    const group = await assertMember(groupId, req.user.id);

    let finalSplit;

    if (splitType === 'custom') {
      if (!Array.isArray(splitBetween) || splitBetween.length === 0) {
        return res.status(400).json({ message: 'splitBetween is required for custom splits' });
      }
      const total = splitBetween.reduce((sum, s) => sum + Number(s.share), 0);
      if (Math.abs(total - Number(amount)) > 0.01) {
        return res.status(400).json({ message: `Custom split shares (${total}) must add up to the total amount (${amount})` });
      }
      finalSplit = splitBetween.map((s) => ({ user: s.user, share: Number(s.share) }));
    } else {
      // Equal split among all group members (or a chosen subset if provided)
      const participantIds = Array.isArray(splitBetween) && splitBetween.length > 0
        ? splitBetween.map((s) => s.user)
        : group.members.map((m) => m._id.toString());

      const equalShare = Number(amount) / participantIds.length;
      finalSplit = participantIds.map((userId) => ({
        user: userId,
        share: Math.round(equalShare * 100) / 100,
      }));

      // Fix rounding drift by adjusting the last participant's share
      const distributed = finalSplit.reduce((sum, s) => sum + s.share, 0);
      const drift = Math.round((Number(amount) - distributed) * 100) / 100;
      if (drift !== 0) finalSplit[finalSplit.length - 1].share += drift;
    }

    const expense = await Expense.create({
      group: groupId,
      description,
      amount,
      category: category || 'other',
      paidBy,
      splitBetween: finalSplit,
      createdBy: req.user.id,
    });

    const populated = await expense.populate([
      { path: 'paidBy', select: 'name email' },
      { path: 'splitBetween.user', select: 'name email' },
    ]);

    res.status(201).json({ expense: populated });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error creating expense' });
  }
});

// @route GET /api/expenses/group/:groupId
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    await assertMember(req.params.groupId, req.user.id);

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splitBetween.user', 'name email')
      .sort({ date: -1 });

    res.json({ expenses });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error fetching expenses' });
  }
});

// @route DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    await assertMember(expense.group, req.user.id);

    if (expense.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the person who logged this expense can delete it' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error deleting expense' });
  }
});

// @route GET /api/expenses/group/:groupId/balances
// Returns each member's net balance (owed vs owes)
router.get('/group/:groupId/balances', auth, async (req, res) => {
  try {
    const group = await assertMember(req.params.groupId, req.user.id);
    const expenses = await Expense.find({ group: req.params.groupId });

    // Initialize net balance for every member at 0
    const netMap = {};
    group.members.forEach((m) => {
      netMap[m._id.toString()] = { userId: m._id.toString(), name: m.name, amount: 0 };
    });

    expenses.forEach((exp) => {
      const paidById = exp.paidBy.toString();
      // Payer gets credited the full amount
      netMap[paidById].amount += exp.amount;
      // Each participant gets debited their share
      exp.splitBetween.forEach((s) => {
        const uid = s.user.toString();
        netMap[uid].amount -= s.share;
      });
    });

    const balances = Object.values(netMap).map((b) => ({
      ...b,
      amount: Math.round(b.amount * 100) / 100,
    }));

    res.json({ balances });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error computing balances' });
  }
});

// @route GET /api/expenses/group/:groupId/settle
// Returns the MINIMUM set of transactions to settle all debts (core algorithm)
router.get('/group/:groupId/settle', auth, async (req, res) => {
  try {
    const group = await assertMember(req.params.groupId, req.user.id);
    const expenses = await Expense.find({ group: req.params.groupId });

    const netMap = {};
    group.members.forEach((m) => {
      netMap[m._id.toString()] = { userId: m._id.toString(), name: m.name, amount: 0 };
    });

    expenses.forEach((exp) => {
      const paidById = exp.paidBy.toString();
      netMap[paidById].amount += exp.amount;
      exp.splitBetween.forEach((s) => {
        netMap[s.user.toString()].amount -= s.share;
      });
    });

    const netBalances = Object.values(netMap);
    const transactions = simplifyDebts(netBalances);

    res.json({
      transactions,
      transactionCount: transactions.length,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error simplifying debts' });
  }
});

// @route GET /api/expenses/group/:groupId/insights
// Category-wise and monthly spending breakdown, for dashboard charts
router.get('/group/:groupId/insights', auth, async (req, res) => {
  try {
    await assertMember(req.params.groupId, req.user.id);
    const expenses = await Expense.find({ group: req.params.groupId });

    const byCategory = {};
    const byMonth = {};

    expenses.forEach((exp) => {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;

      const monthKey = new Date(exp.date).toISOString().slice(0, 7); // YYYY-MM
      byMonth[monthKey] = (byMonth[monthKey] || 0) + exp.amount;
    });

    const categoryBreakdown = Object.entries(byCategory).map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
    }));

    const monthlyBreakdown = Object.entries(byMonth)
      .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      totalSpent: Math.round(totalSpent * 100) / 100,
      categoryBreakdown,
      monthlyBreakdown,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Server error computing insights' });
  }
});

module.exports = router;
