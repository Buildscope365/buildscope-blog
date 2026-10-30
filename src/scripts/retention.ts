export interface RetentionInput {
  payment: string | number;
  percentage: string | number;
  cap: string | number;
  previous: string | number;
}

export interface RetentionResult {
  current: string;
  cumulative: string;
  remaining: string;
  uncapped: string;
  capped: boolean;
}

const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);
const RATE_SCALE = 1_000_000n; // Up to six decimal places in a percentage.
const RATE_DENOMINATOR = 100n * RATE_SCALE;

function parseDecimal(value: string | number, places: number, label: string): bigint {
  const raw = String(value).trim();
  if (!/^(?:\d+)(?:\.\d+)?$/.test(raw)) throw new RangeError(`${label} 必須是零或正數，不能使用科學記數法。`);
  const [whole, fraction = ""] = raw.split(".");
  if (fraction.length > places) throw new RangeError(`${label} 最多只能輸入 ${places} 位小數。`);
  return BigInt(whole) * 10n ** BigInt(places) + BigInt(fraction.padEnd(places, "0") || "0");
}

function money(value: bigint): string {
  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}

/** Exact integer-cent arithmetic; half a cent rounds up. Contract rules must be checked separately. */
export function calculateRetention(input: RetentionInput): RetentionResult {
  const payment = parseDecimal(input.payment, 2, "本期付款金額");
  const cap = parseDecimal(input.cap, 2, "保留款總上限");
  const previous = parseDecimal(input.previous, 2, "以往累計已扣");
  const percentage = parseDecimal(input.percentage, 6, "保留款百分比");
  if ([payment, cap, previous].some((value) => value > MAX_CENTS)) throw new RangeError("金額超出可計算範圍。");
  if (percentage > 100n * RATE_SCALE) throw new RangeError("保留款百分比不可超過 100%。");
  if (previous > cap) throw new RangeError("以往累計保留款不可超過上限。");

  const uncapped = (payment * percentage + RATE_DENOMINATOR / 2n) / RATE_DENOMINATOR;
  const current = uncapped < cap - previous ? uncapped : cap - previous;
  return {
    current: money(current),
    cumulative: money(previous + current),
    remaining: money(cap - previous - current),
    uncapped: money(uncapped),
    capped: current < uncapped,
  };
}
