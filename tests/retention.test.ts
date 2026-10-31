import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateRetention } from "../src/scripts/retention.ts";

test("normal calculation and cumulative amount", () => {
  assert.deepEqual(calculateRetention({ payment: "100000", percentage: "5", cap: "50000", previous: "12000" }), { uncapped: "5000.00", current: "5000.00", cumulative: "17000.00", remaining: "33000.00", capped: false });
});
test("cap truncates the current deduction exactly", () => {
  assert.deepEqual(calculateRetention({ payment: "100000", percentage: "5", cap: "15000", previous: "14999.71" }), { uncapped: "5000.00", current: "0.29", cumulative: "15000.00", remaining: "0.00", capped: true });
});
test("half-cent rounds up, not binary floating-point down", () => {
  assert.equal(calculateRetention({ payment: "10.10", percentage: "5", cap: "1", previous: "0" }).current, "0.51");
  assert.equal(calculateRetention({ payment: "0.01", percentage: "50", cap: "1", previous: "0" }).current, "0.01");
  assert.equal(calculateRetention({ payment: "1", percentage: "0.5", cap: "1", previous: "0" }).current, "0.01");
});
test("fractional rate, zero rate, zero cap and exhausted cap", () => {
  assert.equal(calculateRetention({ payment: "10000", percentage: "0.012345", cap: "10", previous: "0" }).current, "1.23");
  assert.equal(calculateRetention({ payment: "100", percentage: "0", cap: "1", previous: "0" }).current, "0.00");
  assert.equal(calculateRetention({ payment: "100", percentage: "5", cap: "0", previous: "0" }).current, "0.00");
  assert.equal(calculateRetention({ payment: "100", percentage: "5", cap: "1", previous: "1" }).current, "0.00");
});
test("max safe cents stay exact at the cap boundary", () => {
  const result = calculateRetention({ payment: "90071992547409.91", percentage: "100", cap: "90071992547409.91", previous: "90071992547409.90" });
  assert.deepEqual(result, { uncapped: "90071992547409.91", current: "0.01", cumulative: "90071992547409.91", remaining: "0.00", capped: true });
});
test("rejects invalid values", () => {
  for (const input of [
    { payment: -1, percentage: 5, cap: 100, previous: 0 },
    { payment: 100, percentage: 101, cap: 100, previous: 0 },
    { payment: 100, percentage: 5, cap: 100, previous: 101 },
    { payment: "1.001", percentage: 5, cap: 100, previous: 0 },
    { payment: Number.NaN, percentage: 5, cap: 100, previous: 0 },
    { payment: "1e3", percentage: 5, cap: 100, previous: 0 },
    { payment: "90071992547409.92", percentage: 5, cap: 100, previous: 0 },
    { payment: "", percentage: 5, cap: 100, previous: 0 },
    { payment: "1", percentage: "0.1234567", cap: 100, previous: 0 },
  ]) assert.throws(() => calculateRetention(input), RangeError);
});
