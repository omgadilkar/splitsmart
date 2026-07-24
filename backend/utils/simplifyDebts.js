/**
 * Debt Simplification Algorithm
 * ------------------------------
 * Problem: In a group, many small IOUs build up between members
 * (A owes B, B owes C, C owes A, etc). Settling every individual expense
 * one-by-one leads to far more transactions than necessary.
 *
 * Goal: Given each member's NET balance (positive = should receive money,
 * negative = owes money), find the MINIMUM number of transactions that
 * settle all debts.
 *
 * Approach: Greedy matching.
 * 1. Compute net balance per user across all expenses in the group.
 * 2. Split users into creditors (net > 0) and debtors (net < 0).
 * 3. Repeatedly match the person who owes the MOST with the person who is
 *    owed the MOST. Settle the smaller of the two amounts between them.
 *    Whoever's balance hits zero drops out. Repeat until everyone is settled.
 *
 * This is a well-known greedy strategy for this problem. It doesn't
 * guarantee the mathematically optimal minimum in every theoretical case
 * (that's an NP-hard variant related to subset-sum), but in practice it
 * performs very close to optimal and runs in O(n log n) — more than good
 * enough for real-world group sizes.
 *
 * Time complexity: O(n log n) due to sorting; the matching loop itself is O(n).
 */

function simplifyDebts(netBalances) {
  // netBalances: [{ userId, name, amount }]  amount > 0 => owed money, < 0 => owes money
  const EPSILON = 0.01; // ignore floating point dust below 1 paisa/cent

  const creditors = [];
  const debtors = [];

  netBalances.forEach((entry) => {
    if (entry.amount > EPSILON) {
      creditors.push({ ...entry });
    } else if (entry.amount < -EPSILON) {
      debtors.push({ ...entry, amount: -entry.amount }); // store as positive "owes" amount
    }
  });

  // Sort descending so largest creditor/debtor are matched first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0; // pointer into debtors
  let j = 0; // pointer into creditors

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > EPSILON) {
      transactions.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: Math.round(settledAmount * 100) / 100,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount <= EPSILON) i++;
    if (creditor.amount <= EPSILON) j++;
  }

  return transactions;
}

module.exports = simplifyDebts;
