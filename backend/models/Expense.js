const mongoose = require('mongoose');

const SplitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // exact amount this user owes for this expense (supports unequal splits)
    share: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ExpenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: {
      type: String,
      enum: ['food', 'travel', 'stay', 'utilities', 'shopping', 'entertainment', 'other'],
      default: 'other',
    },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    splitBetween: { type: [SplitSchema], required: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
