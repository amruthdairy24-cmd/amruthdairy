import assert from 'node:assert';
import { resolveSubscriptionState } from './billing';

function runTests() {
  console.log('Running resolveSubscriptionState tests...');
  const currentBillingMonthStr = '2026-09-01';
  const currentDateStr = '2026-09-04';

  // TEST 1: New customer (no subscription)
  {
    const res = resolveSubscriptionState({
      subscription: null,
      currentMonthBilling: null,
      latestPaidMonth: null,
      currentBillingMonthStr,
      currentDateStr,
    });
    assert.strictEqual(res.state, 'NOT_SUBSCRIBED');
    assert.strictEqual(res.canRenew, false);
    assert.strictEqual(res.currentMonthPaid, false);
    assert.strictEqual(res.isCovered, false);
    console.log('✔ TEST 1 PASSED: New customer');
  }

  // TEST 2: August paid, September absent (Unrenewed subscriber - Test Customer e15b012f-0635-4da2-99f3-52f27b0be6b1)
  {
    const res = resolveSubscriptionState({
      subscription: {
        id: '9241847e-0c05-40ec-a34c-3a4addf55fbb',
        status: 'active',
        start_date: '2026-08-01',
        end_date: '2026-08-31',
      },
      currentMonthBilling: null,
      latestPaidMonth: '2026-08-01',
      currentBillingMonthStr,
      currentDateStr,
    });
    assert.strictEqual(res.state, 'UNRENEWED_ELIGIBLE');
    assert.strictEqual(res.canRenew, true);
    assert.strictEqual(res.targetMonth, '2026-09-01');
    assert.strictEqual(res.currentMonthPaid, false);
    assert.strictEqual(res.isCovered, false);
    console.log('✔ TEST 2 PASSED: Unrenewed August customer in September');
  }

  // TEST 3: September billing paid
  {
    const res = resolveSubscriptionState({
      subscription: {
        id: 'sub_123',
        status: 'active',
      },
      currentMonthBilling: {
        id: 'bm_sep',
        billing_month: '2026-09-01',
        payment_status: 'paid',
      },
      latestPaidMonth: '2026-09-01',
      currentBillingMonthStr,
      currentDateStr,
    });
    assert.strictEqual(res.state, 'SUBSCRIBED_ACTIVE');
    assert.strictEqual(res.currentMonthPaid, true);
    assert.strictEqual(res.isCovered, true);
    assert.strictEqual(res.targetMonth, '2026-10-01');
    assert.strictEqual(res.canRenew, false);
    console.log('✔ TEST 3 PASSED: Paid September customer');
  }

  // TEST 4: September billing pending
  {
    const res = resolveSubscriptionState({
      subscription: {
        id: 'sub_123',
        status: 'active',
      },
      currentMonthBilling: {
        id: 'bm_sep',
        billing_month: '2026-09-01',
        payment_status: 'pending',
      },
      latestPaidMonth: '2026-08-01',
      currentBillingMonthStr,
      currentDateStr,
    });
    assert.strictEqual(res.state, 'PAYMENT_PENDING');
    assert.strictEqual(res.canRenew, true);
    assert.strictEqual(res.targetMonth, '2026-09-01');
    assert.strictEqual(res.currentMonthPaid, false);
    assert.strictEqual(res.isCovered, false);
    console.log('✔ TEST 4 PASSED: Pending payment customer');
  }

  // TEST 5: Paused customer
  {
    const res = resolveSubscriptionState({
      subscription: {
        id: 'sub_123',
        status: 'paused',
      },
      currentMonthBilling: null,
      latestPaidMonth: '2026-08-01',
      currentBillingMonthStr,
      currentDateStr,
    });
    assert.strictEqual(res.state, 'PAUSED');
    assert.strictEqual(res.canRenew, false);
    assert.strictEqual(res.isCovered, false);
    console.log('✔ TEST 5 PASSED: Paused customer');
  }

  // TEST 6: Cancelled customer
  {
    const res = resolveSubscriptionState({
      subscription: {
        id: 'sub_123',
        status: 'cancelled',
      },
      currentMonthBilling: null,
      latestPaidMonth: null,
      currentBillingMonthStr,
      currentDateStr,
    });
    assert.strictEqual(res.state, 'CANCELLED');
    assert.strictEqual(res.canRenew, true);
    assert.strictEqual(res.isCovered, false);
    console.log('✔ TEST 6 PASSED: Cancelled customer');
  }

  // TEST 7: Valid trial
  {
    const res = resolveSubscriptionState({
      subscription: {
        id: 'sub_123',
        status: 'active',
        plan_type: 'trial',
        end_date: '2026-09-10',
      },
      currentMonthBilling: null,
      latestPaidMonth: null,
      currentBillingMonthStr,
      currentDateStr: '2026-09-04',
    });
    assert.strictEqual(res.state, 'TRIAL_ACTIVE');
    assert.strictEqual(res.canRenew, true);
    assert.strictEqual(res.currentMonthPaid, true);
    assert.strictEqual(res.isCovered, true);
    console.log('✔ TEST 7 PASSED: Valid trial customer');
  }

  // TEST 8: September paid + October prepaid
  {
    const res = resolveSubscriptionState({
      subscription: {
        id: 'sub_123',
        status: 'active',
      },
      currentMonthBilling: {
        billing_month: '2026-09-01',
        payment_status: 'paid',
      },
      latestPaidMonth: '2026-10-01',
      currentBillingMonthStr,
      currentDateStr: '2026-09-04',
    });
    assert.strictEqual(res.state, 'SUBSCRIBED_ACTIVE');
    assert.strictEqual(res.currentMonthPaid, true);
    assert.strictEqual(res.isCovered, true);
    assert.strictEqual(res.targetMonth, '2026-11-01');
    console.log('✔ TEST 8 PASSED: Prepaid future month');
  }

  // TEST 9: Unrenewed customer delivery check (isCovered should be false)
  {
    const res = resolveSubscriptionState({
      subscription: { id: 'sub_123', status: 'active', end_date: '2026-08-31' },
      currentMonthBilling: null,
      latestPaidMonth: '2026-08-01',
      currentBillingMonthStr: '2026-09-01',
      currentDateStr: '2026-09-04',
    });
    assert.strictEqual(res.isCovered, false);
    console.log('✔ TEST 9 PASSED: Delivery check for unrenewed customer (isCovered = false)');
  }

  // TEST 10: Paid current-month customer delivery check (isCovered should be true)
  {
    const res = resolveSubscriptionState({
      subscription: { id: 'sub_123', status: 'active' },
      currentMonthBilling: { payment_status: 'paid' },
      latestPaidMonth: '2026-09-01',
      currentBillingMonthStr: '2026-09-01',
      currentDateStr: '2026-09-04',
    });
    assert.strictEqual(res.isCovered, true);
    console.log('✔ TEST 10 PASSED: Delivery check for paid customer (isCovered = true)');
  }

  console.log('\n🎉 ALL 10 SUBSCRIPTION STATE TEST CASES PASSED SUCCESSFULLY!');
}

runTests();
