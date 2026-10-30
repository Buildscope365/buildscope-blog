export interface RetentionInput {
  payment: number;
  percentage: number;
  cap: number;
  previous: number;
}

export interface RetentionResult {
  current: number;
  cumulative: number;
  remaining: number;
  uncapped: number;
}

/** Amounts are in the user's chosen currency, rounded to two decimal places. */
export function calculateRetention(input: RetentionInput): RetentionResult {
  for (const [key, value] of Object.entries(input)) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError(`${key} 必須是零或正數。`);
    if (key !== "percentage" && Math.abs(Math.round(value * 100) - value * 100) > 0.000001) throw new RangeError(`${key} 最多只能輸入兩位小數。`);
    if (key !== "percentage" && !Number.isSafeInteger(Math.round(value * 100))) throw new RangeError(`${key} 金額太大。`);
  }
  if (input.percentage > 100) throw new RangeError("扣款百分比不可超過 100%。");
  if (input.previous > input.cap) throw new RangeError("以往累計保留款不可超過上限。");

  const payment = Math.round(input.payment * 100);
  const cap = Math.round(input.cap * 100);
  const previous = Math.round(input.previous * 100);
  const uncapped = Math.round(payment * input.percentage / 100);
  const current = Math.min(uncapped, cap - previous);
  return {
    current: current / 100,
    cumulative: (previous + current) / 100,
    remaining: (cap - previous - current) / 100,
    uncapped: uncapped / 100,
  };
}
