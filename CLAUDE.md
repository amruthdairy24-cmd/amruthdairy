@AGENTS.md
## STRICT RULES FOR AI

1. NEVER modify middleware.ts unless explicitly asked
2. NEVER change database schema without showing migration SQL first
3. ALWAYS use adminClient for writes, userClient for reads in API routes
4. Billing calculations ONLY go in src/lib/billing.ts
5. Every API route must have: auth check → role check → business logic
6. Skip deadline is 9PM IST — always check server-side, not just client
7. Carry-forward credits go to billing_adjustments table, NEVER modify paid bills
8. Quantity changes NEVER apply to current month — always next renewal date