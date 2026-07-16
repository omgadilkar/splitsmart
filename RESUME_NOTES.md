# Resume bullets & interview talking points

## Resume bullet points (pick 3-4, tailor numbers to your actual testing)

**Project title:** SplitSmart — Group Expense Splitter with Debt Simplification
*(Full-stack web app · React, Node.js, Express, MongoDB · [live link] · [GitHub link])*

- Built a full-stack expense-splitting application (MERN stack) with JWT
  authentication, supporting equal and custom (unequal) expense splits
  across multiple groups.
- Designed and implemented a greedy debt-simplification algorithm
  (O(n log n)) that reduces the number of settle-up transactions in a group
  by up to 60-70% compared to naive pairwise settlement.
- Modeled a normalized MongoDB schema (Users, Groups, Expenses) with
  Mongoose, supporting role-based group membership and referential
  integrity across collections.
- Built RESTful APIs for group/expense management and a real-time balance
  engine that recalculates net balances on every expense change.
- Wrote unit tests validating the debt-simplification algorithm against
  edge cases (already-settled groups, multi-party circular debts).
- Designed a custom UI system (no template/UI kit) with data visualizations
  (Recharts) for category and monthly spending insights.

## Put this on your resume exactly like this (example)

> **SplitSmart | Personal Project** | React, Node.js, Express, MongoDB, JWT
> - Built a group expense-splitting app with a greedy debt-simplification
>   algorithm that minimizes settle-up transactions (O(n log n))
> - Implemented JWT auth, custom/equal expense splitting, and real-time
>   balance computation across a normalized MongoDB schema
> - [Live demo] · [GitHub]

## Interview talking points — be ready to explain these

**"Walk me through your project."**
Keep it to 60-90 seconds: what problem it solves (splitting group expenses
without everyone individually paying everyone back), the stack, and the one
standout feature (debt simplification).

**"What was the hardest part?"**
Talk about the debt simplification algorithm — explain the greedy approach,
why you chose it over brute force, and its Big-O. Be honest that greedy
is not always mathematically optimal in every theoretical case (that's
closer to an NP-hard min-cost-flow problem), but explain why it's the right
practical trade-off for real group sizes.

**"How did you handle unequal splits?"**
Explain the data model: each expense stores a `splitBetween` array of
`{user, share}` pairs, so unequal splits are just different share values
instead of dividing equally.

**"Why MongoDB over SQL?"**
Because expenses reference variable-length arrays of participants — a
flexible document model avoids a join-heavy schema for something that's
naturally hierarchical (group → expenses → splits).

**"How would you scale this?"**
- Add Redis caching for frequently-read balance calculations
- Move balance computation to be event-driven/incremental instead of
  recalculating from all expenses every time
- Add pagination for expense lists in large, long-running groups

**"What would you add next?"**
- True optimal debt simplification via min-cost-flow (mention you know the
  greedy approach isn't provably optimal in every case — this shows depth)
- Email/push notifications for pending settlements
- Multi-currency support with live exchange rates

## Before your interview

1. Actually run this locally, create 2-3 test users, add expenses, and take
   screenshots (or better, deploy it — a live link is far more convincing
   than a repo).
2. Read through `backend/utils/simplifyDebts.js` until you can explain it
   from memory without looking at the code.
3. Be ready to whiteboard the algorithm on request — interviewers may ask
   you to solve the debt-simplification problem live even without your code
   in front of you.
