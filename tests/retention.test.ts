import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateRetention } from "../src/scripts/retention.ts";

test("normal calculation and cumulative amount", () => {
  assert.deepEqual(calculateRetention({ payment: 100000, percentage: 5, cap: 50000, previous: 12000 }), { uncapped: 5000, current: 5000, cumulative: 17000, remaining: 33000 });
});
test("cap truncates the current deduction exactly", () => {
  assert.deepEqual(calculateRetention({ payment: 100000, percentage: 5, cap: 15000, previous: 14999.71 }), { uncapped: 5000, current: .29, cumulative: 15000, remaining: 0 });
});
test("zero cap and cent rounding", () => {
  assert.equal(calculateRetention({ payment: 10.10, percentage: 5, cap: 1, previous: 0 }).current, .51);
  assert.equal(calculateRetention({ payment: 100, percentage: 5, cap: 0, previous: 0 }).current, 0);
});
test("rejects invalid values", () => {
  for (const input of [
    { payment: -1, percentage: 5, cap: 100, previous: 0 },
    { payment: 100, percentage: 101, cap: 100, previous: 0 },
    { payment: 100, percentage: 5, cap: 100, previous: 101 },
    { payment: 1.001, percentage: 5, cap: 100, previous: 0 },
    { payment: Number.NaN, percentage: 5, cap: 100, previous: 0 },
  ]) assert.throws(() => calculateRetention(input), RangeError);
});
