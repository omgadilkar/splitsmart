const express = require('express');
const mongoose = require('mongoose');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

const router = express.Router();

// @route POST /api/groups
// Create a new group with the creator as the first member
router.post('/', auth, async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });

    const uniqueMembers = Array.from(new Set([req.user.id, ...memberIds]));

    const group = await Group.create({
      name,
      createdBy: req.user.id,
      members: uniqueMembers,
    });

    const populated = await group.populate('members', 'name email');
    res.status(201).json({ group: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error creating group', error: err.message });
  }
});

// @route GET /api/groups
// List all groups the logged-in user belongs to
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching groups', error: err.message });
  }
});

// @route GET /api/groups/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some((m) => m._id.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this group' });

    res.json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching group', error: err.message });
  }
});

// @route POST /api/groups/:id/members
// Add a member to an existing group by userId
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some((m) => m.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ message: 'You are not a member of this group' });

    if (!group.members.some((m) => m.toString() === userId)) {
      group.members.push(userId);
      await group.save();
    }

    const populated = await group.populate('members', 'name email');
    res.json({ group: populated });
  } catch (err) {
    res.status(500).json({ message: 'Server error adding member', error: err.message });
  }
});

// @route DELETE /api/groups/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the group creator can delete this group' });
    }

    await Expense.deleteMany({ group: group._id });
    await group.deleteOne();

    res.json({ message: 'Group and its expenses deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting group', error: err.message });
  }
});

module.exports = router;
