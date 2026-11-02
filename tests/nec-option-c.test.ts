import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateForecast, type ForecastInput } from "../src/scripts/necOptionC.ts";
const base = (): ForecastInput => ({ originalTarget: "1000", implemented: [], pending: [], definedCost: "900", feePercent: "0", stressPercent: "0", ranges: [{ upperPercent: "80", contractorPercent: "10" }, { upperPercent: "100", contractorPercent: "50" }, { upperPercent: "110", contractorPercent: "25" }, { upperPercent: null, contractorPercent: "75" }] });
test("marginal bands: gain below and across thresholds", () => {
  const i = base(); i.definedCost = "700";
  const s = calculateForecast(i).scenarios[0];
  assert.equal(s.contractorShare, "110.00"); // 700–800 at 10%, 800–1000 at 50%
  assert.equal(s.forecastPayment, "810.00");
  assert.equal(s.clientShare, "190.00");
  i.definedCost = "800"; assert.equal(calculateForecast(i).scenarios[0].contractorShare, "100.00");
  i.definedCost = "900"; assert.equal(calculateForecast(i).scenarios[0].contractorShare, "50.00");
  i.definedCost = "1000"; assert.equal(calculateForecast(i).scenarios[0].contractorShare, "0.00");
});
test("pain crosses upper threshold marginally, never caps at Target", () => {
  const i = base(); i.definedCost = "1200";
  const s = calculateForecast(i).scenarios[0];
  assert.equal(s.contractorShare, "-100.00"); // 100–110% at 25%, 110–120% at 75%
  assert.equal(s.forecastPayment, "1100.00");
  assert.equal(s.clientShare, "-100.00");
  assert.deepEqual(s.bands.map(b => b.amount), ["800.00", "200.00", "100.00", "100.00"]);
});
test("implemented changes Target and incremental cost; pending only affect selected/all", () => {
  const i = base(); i.implemented = [{ ref: "CE1", targetChange: "200", costChange: "50" }, { ref: "CE2", targetChange: "-50", costChange: "0" }];
  i.pending = [{ ref: "P1", targetChange: "100", costChange: "80", included: true }, { ref: "P2", targetChange: "-20", costChange: "10", included: false }];
  const r = calculateForecast(i);
  assert.deepEqual(r.scenarios.map(s => s.target), ["1150.00", "1250.00", "1230.00"]);
  assert.deepEqual(r.scenarios.map(s => s.definedCost), ["950.00", "1030.00", "1040.00"]);
  assert.equal(r.implementedTotal, "150.00"); assert.equal(r.pendingSelected, "100.00");
});
test("fee and stress use decimal-safe rounding and only base Defined Cost", () => {
  const i = base(); i.originalTarget = "100.01"; i.definedCost = "10.10"; i.feePercent = "5"; i.stressPercent = "10";
  i.implemented = [{ ref: "CE", targetChange: "0", costChange: "1" }];
  const r = calculateForecast(i);
  assert.equal(r.scenarios[0].fee, "0.56"); // (10.10+1.00) × 5%
  assert.equal(r.scenarios[3].definedCost, "10.09");
  assert.equal(r.scenarios[4].definedCost, "12.11");
  assert.equal(r.scenarios[4].fee, "0.61");
});
test("fractional boundaries, smallest cent, 0% and 100% shares", () => {
  const i = base(); i.originalTarget = "0.03"; i.definedCost = "0.01";
  i.ranges = [{ upperPercent: "33.333333", contractorPercent: "0" }, { upperPercent: "100", contractorPercent: "100" }, { upperPercent: null, contractorPercent: "100" }];
  const s = calculateForecast(i).scenarios[0];
  assert.equal(s.contractorShare, "0.02"); assert.equal(s.forecastPayment, "0.03");
  i.definedCost = "0.04"; assert.equal(calculateForecast(i).scenarios[0].contractorShare, "-0.01");
});
test("large exact cents and signed half-up share", () => {
  const i = base(); i.originalTarget = "90071992547409.90"; i.definedCost = "90071992547409.89"; i.ranges = [{ upperPercent: null, contractorPercent: "50" }];
  assert.equal(calculateForecast(i).scenarios[0].contractorShare, "0.01");
  i.definedCost = "90071992547409.91"; assert.equal(calculateForecast(i).scenarios[0].contractorShare, "-0.01");
});
test("rejects malformed amounts, invalid ranges and impossible scenarios", () => {
  const bad = (edit: (i: ForecastInput) => void) => { const i = base(); edit(i); assert.throws(() => calculateForecast(i), RangeError); };
  bad(i => { i.originalTarget = "0"; }); bad(i => { i.originalTarget = "1e6"; });
  bad(i => { i.definedCost = "1.001"; }); bad(i => { i.feePercent = "101"; });
  bad(i => { i.stressPercent = "100.000001"; });
  bad(i => { i.ranges[1].upperPercent = "80"; });
  bad(i => { i.ranges[0].upperPercent = null; });
  bad(i => { i.ranges.pop(); });
  bad(i => { i.ranges[0].contractorPercent = "-1"; });
  bad(i => { i.implemented = [{ ref: "CE", targetChange: "-1000" }]; });
  bad(i => { i.pending = [{ ref: "CE", targetChange: "0", costChange: "-1000", included: false }]; });
  bad(i => { i.definedCost = "90071992547409.92"; });
});
