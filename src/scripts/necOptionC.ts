/** NEC4 ECC Option C planning model. Money is integer cents; percentages have four decimal places. */
export type CE = { ref: string; targetChange: string; costChange?: string };
export type PendingCE = CE & { included: boolean };
export type ShareRange = { upperPercent: string | null; contractorPercent: string };
export type ForecastInput = {
  originalTarget: string;
  implemented: CE[];
  pending: PendingCE[];
  definedCost: string;
  feePercent: string;
  ranges: ShareRange[];
  stressPercent?: string;
};
export type Band = { from: string; to: string; rate: string; amount: string; share: string };
export type Scenario = {
  name: string; target: string; definedCost: string; fee: string; pwdd: string;
  variance: string; contractorShare: string; forecastPayment: string; clientShare: string; bands: Band[];
};
export type ForecastResult = { scenarios: Scenario[]; implementedTotal: string; pendingSelected: string; pendingAll: string };

const SCALE = 1_000_000n; // 100% = 100,000,000; percentage precision 0.0001%.
const DENOMINATOR = 100n * SCALE;
const MAX = BigInt(Number.MAX_SAFE_INTEGER);
const digits = (raw: string | number, places: number, label: string, signed = false): bigint => {
  const value = String(raw).trim();
  if (!(signed ? /^-?\d+(?:\.\d+)?$/ : /^\d+(?:\.\d+)?$/).test(value)) throw new RangeError(`${label}：請輸入有效十進制數字。`);
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
  if (fraction.length > places) throw new RangeError(`${label}：最多 ${places} 位小數。`);
  const result = BigInt(whole) * 10n ** BigInt(places) + BigInt(fraction.padEnd(places, "0") || "0");
  if (places === 2 && result > MAX) throw new RangeError(`${label}：金額超出計算範圍。`);
  return negative ? -result : result;
};
const amount = (v: string, label: string, signed = false) => digits(v, 2, label, signed);
const percent = (v: string, label: string) => {
  const n = digits(v, 6, label);
  if (n > DENOMINATOR) throw new RangeError(`${label}：不可超過 100%。`);
  return n;
};
const fmt = (n: bigint) => `${n < 0n ? "-" : ""}${(n < 0n ? -n : n) / 100n}.${String((n < 0n ? -n : n) % 100n).padStart(2, "0")}`;
const round = (numerator: bigint, denominator: bigint) => numerator >= 0n
  ? (numerator + denominator / 2n) / denominator
  : -((-numerator + denominator / 2n) / denominator);
const checked = (n: bigint, label: string) => {
  if (n < 0n || n > MAX) throw new RangeError(`${label}：調整後金額須為零或正數，且在可計算範圍內。`);
  return n;
};
const sum = (items: CE[], key: "targetChange" | "costChange") => items.reduce((n, item) => n + amount(item[key] || "0", `${item.ref || "CE"} ${key}`, true), 0n);

/** Share ranges are marginal bands over PWDD as a percentage of the adjusted total of Prices. */
export function calculateForecast(input: ForecastInput): ForecastResult {
  const original = amount(input.originalTarget, "Original Target");
  if (original === 0n) throw new RangeError("Original Target 必須大於零，否則 share range 比率無法計算。");
  const baseCost = amount(input.definedCost, "Defined Cost Forecast");
  const feeRate = percent(input.feePercent, "Fee percentage");
  const stressRate = percent(input.stressPercent || "0", "成本敏感度");
  if (!input.ranges.length || input.ranges.length > 12) throw new RangeError("請設定 1 至 12 個 Share Ranges。");
  if (input.implemented.length > 100 || input.pending.length > 100) throw new RangeError("CE 數量超出上限（各 100 項）。");
  const boundaries: bigint[] = [];
  const rates: bigint[] = [];
  let last = 0n;
  input.ranges.forEach((range, index) => {
    const upper = range.upperPercent === null ? null : digits(range.upperPercent, 6, `第 ${index + 1} 段上限`);
    if (upper === null && index !== input.ranges.length - 1) throw new RangeError("只有最後一段可不設上限。");
    if (upper !== null && (upper <= last || upper > 1000n * SCALE)) throw new RangeError("Share Range 上限須遞增，並不超過 1000%。");
    if (upper !== null) { boundaries.push(upper); last = upper; }
    rates.push(percent(range.contractorPercent, `第 ${index + 1} 段 Contractor Share`));
  });
  if (input.ranges.at(-1)?.upperPercent !== null) throw new RangeError("最後一段必須開放上限。");

  const implementedTarget = sum(input.implemented, "targetChange");
  const selected = input.pending.filter(ce => ce.included);
  const selectedTarget = sum(selected, "targetChange");
  const allTarget = sum(input.pending, "targetChange");
  const implementedCost = sum(input.implemented, "costChange");
  const selectedCost = sum(selected, "costChange");
  const allCost = sum(input.pending, "costChange");
  // Cost changes are incremental to baseCost, never a second estimate of a cost already in it.
  const build = (name: string, targetChange: bigint, costChange: bigint, stress = 0n): Scenario => {
    const target = checked(original + implementedTarget + targetChange, "Adjusted Target");
    if (target === 0n) throw new RangeError("Adjusted Target 必須大於零，否則 Share Range 比率無法計算。");
    const cost = checked(baseCost + implementedCost + costChange + round(baseCost * stress, DENOMINATOR), "Defined Cost");
    const fee = round(cost * feeRate, DENOMINATOR);
    const pwdd = checked(cost + fee, "Forecast PWDD");
    let prior = 0n;
    let weighted = 0n;
    const bands: Band[] = input.ranges.map((range, index) => {
      const upper = range.upperPercent === null ? pwdd : round(target * boundaries[index], DENOMINATOR);
      const end = upper < pwdd ? upper : pwdd;
      const slice = end > prior ? end - prior : 0n;
      weighted += slice * rates[index];
      const band = { from: fmt(prior), to: range.upperPercent === null ? "∞" : fmt(upper), rate: range.contractorPercent, amount: fmt(slice), share: fmt(round(slice * rates[index], DENOMINATOR)) };
      prior = end;
      return band;
    });
    // Contractor's share is the signed difference of the weighted area between target and PWDD.
    let targetWeighted = 0n;
    let lower = 0n;
    input.ranges.forEach((range, index) => {
      const cap = range.upperPercent === null ? target : round(target * boundaries[index], DENOMINATOR);
      const end = cap < target ? cap : target;
      if (end > lower) targetWeighted += (end - lower) * rates[index];
      lower = end;
    });
    const contractor = round(targetWeighted - weighted, DENOMINATOR);
    const variance = target - pwdd;
    const payment = checked(pwdd + contractor, "Forecast payment");
    return { name, target: fmt(target), definedCost: fmt(cost), fee: fmt(fee), pwdd: fmt(pwdd), variance: fmt(variance), contractorShare: fmt(contractor), forecastPayment: fmt(payment), clientShare: fmt(variance - contractor), bands };
  };
  const scenarios = [
    build("已實施 CE · Current", 0n, 0n),
    build("選取 Pending CE · Selected", selectedTarget, selectedCost),
    build("全部 Pending CE · All", allTarget, allCost),
  ];
  if (stressRate > 0n) {
    scenarios.push(build("Selected · 成本下降", selectedTarget, selectedCost, -stressRate));
    scenarios.push(build("Selected · 成本上升", selectedTarget, selectedCost, stressRate));
  }
  return { scenarios, implementedTotal: fmt(implementedTarget), pendingSelected: fmt(selectedTarget), pendingAll: fmt(allTarget) };
}
