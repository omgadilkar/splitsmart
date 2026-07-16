/**
 * Lightweight tests for the debt simplification algorithm.
 * No external test framework needed — run directly with:
 *   node utils/simplifyDebts.test.js
 */
const assert = require('assert');
const simplifyDebts = require('./simplifyDebts');

function sumTransactionsForUser(transactions, userId) {
  const paid = transactions.filter((t) => t.from === userId).reduce((s, t) => s + t.amount, 0);
  const received = transactions.filter((t) => t.to === userId).reduce((s, t) => s + t.amount, 0);
  return { paid, received };
}

// Test 1: Simple triangle debt (A owes B, B owes C, C owes A) should net to
// far fewer transactions than the 3 original IOUs, ideally 0-2 transactions.
(() => {
  const balances = [
    { userId: 'A', name: 'A', amount: -50 }, // A owes 50 net
    { userId: 'B', name: 'B', amount: 20 },  // B is owed 20 net
    { userId: 'C', name: 'C', amount: 30 },  // C is owed 30 net
  ];
  const result = simplifyDebts(balances);
  assert.ok(result.length <= 2, 'Should settle in 2 or fewer transactions');

  const totalPaid = result.reduce((s, t) => s + t.amount, 0);
  assert.strictEqual(totalPaid, 50, 'Total settled amount should equal total debt');
  console.log('Test 1 passed: triangle debt simplified to', result.length, 'transaction(s)');
})();

// Test 2: Already-settled group should produce zero transactions.
(() => {
  const balances = [
    { userId: 'A', name: 'A', amount: 0 },
    { userId: 'B', name: 'B', amount: 0 },
  ];
  const result = simplifyDebts(balances);
  assert.strictEqual(result.length, 0, 'No transactions needed when everyone is settled');
  console.log('Test 2 passed: settled group produces 0 transactions');
})();

// Test 3: Larger group (5 people) - transaction count should never exceed n-1.
(() => {
  const balances = [
    { userId: 'A', name: 'A', amount: -120 },
    { userId: 'B', name: 'B', amount: 40 },
    { userId: 'C', name: 'C', amount: -30 },
    { userId: 'D', name: 'D', amount: 90 },
    { userId: 'E', name: 'E', amount: 20 },
  ];
  const result = simplifyDebts(balances);
  assert.ok(result.length <= balances.length - 1, 'Transactions should never exceed n-1 for n members');

  // Verify every individual net balance is satisfied by the transactions
  balances.forEach((b) => {
    const { paid, received } = sumTransactionsForUser(result, b.userId);
    const netFromTransactions = Math.round((received - paid) * 100) / 100;
    assert.strictEqual(netFromTransactions, b.amount, `Net for ${b.userId} should match original balance`);
  });
  console.log('Test 3 passed: 5-person group settled in', result.length, 'transactions, all balances verified');
})();

console.log('\nAll tests passed.');
