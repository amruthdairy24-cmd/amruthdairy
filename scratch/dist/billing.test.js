"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_assert_1 = __importDefault(require("node:assert"));
const billing_1 = require("./billing");
function runTests() {
    console.log('Running resolveSubscriptionState tests...');
    const currentBillingMonthStr = '2026-09-01';
    const currentDateStr = '2026-09-04';
    // TEST 1: New customer (no subscription)
    {
        const res = (0, billing_1.resolveSubscriptionState)({
            subscription: null,
            currentMonthBilling: null,
            latestPaidMonth: null,
            currentBillingMonthStr,
            currentDateStr,
        });
        node_assert_1.default.strictEqual(res.state, 'NOT_SUBSCRIBED');
        node_assert_1.default.strictEqual(res.canRenew, false);
        node_assert_1.default.strictEqual(res.currentMonthPaid, false);
        node_assert_1.default.strictEqual(res.isCovered, false);
        console.log('✔ TEST 1 PASSED: New customer');
    }
    // TEST 2: August paid, September absent (Unrenewed subscriber - Test Customer e15b012f-0635-4da2-99f3-52f27b0be6b1)
    {
        const res = (0, billing_1.resolveSubscriptionState)({
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
        node_assert_1.default.strictEqual(res.state, 'UNRENEWED_ELIGIBLE');
        node_assert_1.default.strictEqual(res.canRenew, true);
        node_assert_1.default.strictEqual(res.targetMonth, '2026-09-01');
        node_assert_1.default.strictEqual(res.currentMonthPaid, false);
        node_assert_1.default.strictEqual(res.isCovered, false);
        console.log('✔ TEST 2 PASSED: Unrenewed August customer in September');
    }
    // TEST 3: September billing paid
    {
        const res = (0, billing_1.resolveSubscriptionState)({
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
        node_assert_1.default.strictEqual(res.state, 'SUBSCRIBED_ACTIVE');
        node_assert_1.default.strictEqual(res.currentMonthPaid, true);
        node_assert_1.default.strictEqual(res.isCovered, true);
        node_assert_1.default.strictEqual(res.targetMonth, '2026-10-01');
        node_assert_1.default.strictEqual(res.canRenew, false);
        console.log('✔ TEST 3 PASSED: Paid September customer');
    }
    // TEST 4: September billing pending
    {
        const res = (0, billing_1.resolveSubscriptionState)({
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
        node_assert_1.default.strictEqual(res.state, 'PAYMENT_PENDING');
        node_assert_1.default.strictEqual(res.canRenew, true);
        node_assert_1.default.strictEqual(res.targetMonth, '2026-09-01');
        node_assert_1.default.strictEqual(res.currentMonthPaid, false);
        node_assert_1.default.strictEqual(res.isCovered, false);
        console.log('✔ TEST 4 PASSED: Pending payment customer');
    }
    // TEST 5: Paused customer
    {
        const res = (0, billing_1.resolveSubscriptionState)({
            subscription: {
                id: 'sub_123',
                status: 'paused',
            },
            currentMonthBilling: null,
            latestPaidMonth: '2026-08-01',
            currentBillingMonthStr,
            currentDateStr,
        });
        node_assert_1.default.strictEqual(res.state, 'PAUSED');
        node_assert_1.default.strictEqual(res.canRenew, false);
        node_assert_1.default.strictEqual(res.isCovered, false);
        console.log('✔ TEST 5 PASSED: Paused customer');
    }
    // TEST 6: Cancelled customer
    {
        const res = (0, billing_1.resolveSubscriptionState)({
            subscription: {
                id: 'sub_123',
                status: 'cancelled',
            },
            currentMonthBilling: null,
            latestPaidMonth: null,
            currentBillingMonthStr,
            currentDateStr,
        });
        node_assert_1.default.strictEqual(res.state, 'CANCELLED');
        node_assert_1.default.strictEqual(res.canRenew, true);
        node_assert_1.default.strictEqual(res.isCovered, false);
        console.log('✔ TEST 6 PASSED: Cancelled customer');
    }
    // TEST 7: Valid trial
    {
        const res = (0, billing_1.resolveSubscriptionState)({
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
        node_assert_1.default.strictEqual(res.state, 'TRIAL_ACTIVE');
        node_assert_1.default.strictEqual(res.canRenew, true);
        node_assert_1.default.strictEqual(res.currentMonthPaid, true);
        node_assert_1.default.strictEqual(res.isCovered, true);
        console.log('✔ TEST 7 PASSED: Valid trial customer');
    }
    // TEST 8: September paid + October prepaid
    {
        const res = (0, billing_1.resolveSubscriptionState)({
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
        node_assert_1.default.strictEqual(res.state, 'SUBSCRIBED_ACTIVE');
        node_assert_1.default.strictEqual(res.currentMonthPaid, true);
        node_assert_1.default.strictEqual(res.isCovered, true);
        node_assert_1.default.strictEqual(res.targetMonth, '2026-11-01');
        console.log('✔ TEST 8 PASSED: Prepaid future month');
    }
    // TEST 9: Unrenewed customer delivery check (isCovered should be false)
    {
        const res = (0, billing_1.resolveSubscriptionState)({
            subscription: { id: 'sub_123', status: 'active', end_date: '2026-08-31' },
            currentMonthBilling: null,
            latestPaidMonth: '2026-08-01',
            currentBillingMonthStr: '2026-09-01',
            currentDateStr: '2026-09-04',
        });
        node_assert_1.default.strictEqual(res.isCovered, false);
        console.log('✔ TEST 9 PASSED: Delivery check for unrenewed customer (isCovered = false)');
    }
    // TEST 10: Paid current-month customer delivery check (isCovered should be true)
    {
        const res = (0, billing_1.resolveSubscriptionState)({
            subscription: { id: 'sub_123', status: 'active' },
            currentMonthBilling: { payment_status: 'paid' },
            latestPaidMonth: '2026-09-01',
            currentBillingMonthStr: '2026-09-01',
            currentDateStr: '2026-09-04',
        });
        node_assert_1.default.strictEqual(res.isCovered, true);
        console.log('✔ TEST 10 PASSED: Delivery check for paid customer (isCovered = true)');
    }
    console.log('\n🎉 ALL 10 SUBSCRIPTION STATE TEST CASES PASSED SUCCESSFULLY!');
}
runTests();
