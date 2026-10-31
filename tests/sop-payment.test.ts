import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateDeadlines, screenCoverage, statutoryEnd, dayNumber, iso, type ScopeInput } from "../src/scripts/sopPayment.ts";

const base = { serviceDate: "2026-03-01", asOf: "2026-03-02", holidaysConfirmed: true };
test("30/60 calendar days, excluding service day; Sunday at endpoint rolls", () => {
  const r = calculateDeadlines(base);
  assert.equal(r.statutoryResponse, "2026-03-31");
  assert.equal(r.statutoryPayment, "2026-04-30");
});
test("earlier contractual response and payment; payment also caps response", () => {
  assert.equal(calculateDeadlines({ ...base, responseDays: "14" }).response, "2026-03-15");
  const r = calculateDeadlines({ ...base, paymentDays: "10" });
  assert.equal(r.payment, "2026-03-11"); assert.equal(r.response, "2026-03-11");
});
test("contract dates equal statutory boundaries", () => {
  const r = calculateDeadlines({ ...base, responseDate: "2026-03-31", paymentDate: "2026-04-30" });
  assert.equal(r.response, r.statutoryResponse); assert.equal(r.payment, r.statutoryPayment);
});
test("early claim deemed on billing date; later claim resets billing-based contractual periods only", () => {
  const early = calculateDeadlines({ ...base, serviceDate: "2026-01-25", billingDate: "2026-01-31" });
  assert.equal(early.deemed, "2026-01-31"); assert.equal(early.statutoryResponse, "2026-03-02");
  const late = calculateDeadlines({ ...base, serviceDate: "2026-02-05", billingDate: "2026-01-31", responseDays: "14", responseBasis: "billing", paymentDays: "30", paymentBasis: "billing" });
  assert.equal(late.deemed, "2026-02-05"); assert.equal(late.contractualResponse, "2026-02-19"); assert.equal(late.contractualPayment, "2026-03-07");
});
test("end of month, leap day, year end", () => {
  assert.equal(calculateDeadlines({ serviceDate: "2024-01-31", asOf: "2024-02-01" }).statutoryResponse, "2024-03-01");
  assert.equal(calculateDeadlines({ serviceDate: "2024-02-29", asOf: "2024-03-01" }).statutoryResponse, "2024-03-30");
  assert.equal(calculateDeadlines({ serviceDate: "2025-12-31", asOf: "2026-01-01" }).statutoryPayment, "2026-03-02");
});
test("Saturday remains; Sunday and confirmed public holiday or warning roll to next eligible day", () => {
  assert.equal(iso(statutoryEnd(dayNumber("2026-01-01"), 30, new Set())), "2026-01-31");
  assert.equal(iso(statutoryEnd(dayNumber("2026-01-02"), 30, new Set([dayNumber("2026-02-02")]))), "2026-02-03");
  assert.equal(calculateDeadlines({ serviceDate: "2026-01-01", asOf: "2026-01-02", exceptionalDays: ["2026-01-31"] }).statutoryResponse, "2026-02-02");
});
test("2026 National Day is a general holiday: 30-day endpoint moves from 1 to 2 October", () => {
  // G.N. 2965 of 2025 lists Thursday 1 October 2026 as a general holiday.
  const r = calculateDeadlines({ serviceDate: "2026-09-01", asOf: "2026-09-02", exceptionalDays: ["2026-10-01"], holidaysConfirmed: true });
  assert.equal(r.statutoryResponse, "2026-10-02");
});
test("approaching deadline is labelled without asserting a breach", () => {
  const r = calculateDeadlines({ ...base, asOf: "2026-03-25" });
  assert.equal(r.responseStatus, "期限將至（尚餘 6 日）");
});
test("actual response/payment and overdue days", () => {
  const r = calculateDeadlines({ ...base, asOf: "2026-05-03", actualResponse: "2026-04-02", actualPayment: "2026-04-30" });
  assert.equal(r.responseStatus, "實際遲 2 日"); assert.equal(r.paymentStatus, "已於期限內記錄");
  assert.equal(calculateDeadlines({ ...base, asOf: "2026-05-03" }).paymentStatus, "可能逾期 3 日");
});
test("missing and invalid dates/contract clauses rejected", () => {
  for (const input of [{ ...base, serviceDate: "" }, { ...base, serviceDate: "2026-02-30" }, { ...base, responseDays: "2.5" }, { ...base, billingDate: "", responseDays: "5", responseBasis: "billing" as const }, { ...base, responseDays: "2", responseDate: "2026-03-03" }]) assert.throws(() => calculateDeadlines(input), RangeError);
});
const scope: ScopeInput = { tier: "main", project: "public", kind: "works", mainContractDate: "2026-01-01", mainValue: "5000000", mainCovered: "unknown", hongKong: "yes", privateSite: "unknown", baApproval: "unknown" };
test("coverage threshold, pre-commencement, subcontract dependency and exclusions", () => {
  assert.equal(screenCoverage(scope).status, "potential");
  assert.equal(screenCoverage({ ...scope, mainValue: "4999999" }).status, "outside");
  assert.equal(screenCoverage({ ...scope, mainContractDate: "2025-08-27" }).status, "outside");
  assert.equal(screenCoverage({ ...scope, tier: "sub" }).status, "uncertain");
  assert.equal(screenCoverage({ ...scope, tier: "sub", mainCovered: "yes" }).status, "potential");
  assert.equal(screenCoverage({ ...scope, project: "private", privateSite: "existingResidential" }).status, "outside");
  assert.equal(screenCoverage({ ...scope, project: "private", privateSite: "existingNonResidential", baApproval: "unknown" }).status, "uncertain");
});
