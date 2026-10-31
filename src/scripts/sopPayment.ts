export type Coverage = "potential" | "outside" | "uncertain";
export interface ScopeInput {
  tier: "main" | "sub" | "";
  project: "public" | "private" | "";
  kind: "works" | "services" | "mixed" | "";
  mainContractDate: string;
  mainValue: string;
  mainCovered: "yes" | "no" | "unknown";
  hongKong: "yes" | "no" | "unknown";
  privateSite: "new" | "existingResidential" | "existingNonResidential" | "other" | "unknown";
  baApproval: "yes" | "no" | "unknown";
}
export interface DeadlineInput {
  serviceDate: string;
  billingDate?: string;
  responseDays?: string;
  responseDate?: string;
  responseBasis?: "service" | "billing";
  paymentDays?: string;
  paymentDate?: string;
  paymentBasis?: "service" | "billing";
  actualResponse?: string;
  actualPayment?: string;
  asOf: string;
  exceptionalDays?: string[];
  holidaysConfirmed?: boolean;
}

const DAY = 86_400_000;
export function dayNumber(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("請輸入有效日期（YYYY-MM-DD）。");
  const [year, month, day] = value.split("-").map(Number);
  const time = Date.UTC(year, month - 1, day);
  if (year < 1900 || year > 9999 || new Date(time).toISOString().slice(0, 10) !== value) throw new RangeError("日期不存在或超出範圍。");
  return time / DAY;
}
export function iso(day: number): string { return new Date(day * DAY).toISOString().slice(0, 10); }
function minimum(...days: (number | undefined)[]): number { return Math.min(...days.filter((day): day is number => day !== undefined)); }
function optional(value?: string): number | undefined { return value ? dayNumber(value) : undefined; }
function period(value?: string): number | undefined {
  if (!value) return undefined;
  if (!/^\d{1,4}$/.test(value) || Number(value) > 3650) throw new RangeError("合約日數須為 0 至 3650 的整數；如條款使用工作日或複雜公式，請另行覆核。");
  return Number(value);
}
export function screenCoverage(input: ScopeInput): { status: Coverage; reasons: string[] } {
  const reasons: string[] = [];
  if (input.mainContractDate && dayNumber(input.mainContractDate) < dayNumber("2025-08-28")) return { status: "outside", reasons: ["主合約於 2025-08-28 前訂立；法例不追溯適用其分判合約。"] };
  if (input.hongKong === "no") return { status: "outside", reasons: ["本付款所涉工程在香港境外。"] };
  if (input.tier === "sub" && input.mainCovered === "no") return { status: "outside", reasons: ["已確認上游主合約不受條例涵蓋。"] };
  if (input.project === "private" && input.privateSite === "existingResidential") return { status: "outside", reasons: ["現有私人住宅單位及相關大廈公用部分工程屬法定排除範圍；混合地點須另核對。"] };
  if (input.tier === "main" && input.kind && input.kind !== "mixed" && input.mainValue) {
    const value = Number(input.mainValue);
    if (!Number.isFinite(value) || value < 0) throw new RangeError("主合約價值必須是非負數。");
    if (value < (input.kind === "works" ? 5_000_000 : 500_000)) return { status: "outside", reasons: ["主合約簽訂時價值低於相應法定門檻。"] };
  }
  if (!input.mainContractDate || !input.tier || !input.project || !input.kind || input.hongKong !== "yes") reasons.push("主合約日期、類型、工程地點或工作性質未足以確認。");
  if (input.kind === "mixed") reasons.push("工程與貨品／服務混合合約須核對 Schedule 4 的價值分類。");
  if (input.tier === "sub" && input.mainCovered !== "yes") reasons.push("分判合約須核實上游主合約是否涵蓋，分判價值本身沒有最低門檻。");
  if (input.tier === "main" && !input.mainValue) reasons.push("欠缺主合約簽訂時的合資格價值。");
  if (input.project === "private" && (input.privateSite === "unknown" || !input.privateSite || (input.privateSite === "existingNonResidential" && input.baApproval !== "yes"))) reasons.push("私人現有非住宅工程須核對 BA 批准及同意，以及合資格價值；現有住宅排除亦須核對地點。");
  return { status: reasons.length ? "uncertain" : "potential", reasons: reasons.length ? reasons : ["初步符合輸入的篩選條件，仍須核對完整合約及法定定義。"] };
}

/** Cap. 1 s.71: exclude event day; roll final day if public holiday, gale or black rainstorm warning day.
 * Sundays are public holidays. Saturday alone is not a roll-forward condition. Caller supplies other affected dates.
 */
export function statutoryEnd(start: number, length: number, exceptional: Set<number>): number {
  let end = start + length;
  while (new Date(end * DAY).getUTCDay() === 0 || exceptional.has(end)) end++;
  return end;
}
export function calculateDeadlines(input: DeadlineInput) {
  const service = dayNumber(input.serviceDate);
  const billing = optional(input.billingDate);
  const asOf = dayNumber(input.asOf);
  const actualResponse = optional(input.actualResponse);
  const actualPayment = optional(input.actualPayment);
  const exceptional = new Set((input.exceptionalDays ?? []).filter(Boolean).map(dayNumber));
  const deemed = billing !== undefined && service < billing ? billing : service;
  const contract = (days: string | undefined, date: string | undefined, basis: "service" | "billing" | undefined) => {
    if (days && date) throw new RangeError("合約期限請選擇指定日期或日數其中一種。");
    const count = period(days);
    if (basis === "billing" && billing === undefined && count !== undefined) throw new RangeError("以發單日計的合約期限須輸入發單日。");
    // ss.15(3), 20(3): late service replaces billing date ONLY for billing-based contractual formula.
    const start = basis === "billing" ? Math.max(service, billing!) : service;
    return date ? dayNumber(date) : count === undefined ? undefined : start + count;
  };
  const contractualPayment = contract(input.paymentDays, input.paymentDate, input.paymentBasis);
  const contractualResponse = contract(input.responseDays, input.responseDate, input.responseBasis);
  const statutoryPayment = statutoryEnd(deemed, 60, exceptional);
  const statutoryResponse = statutoryEnd(deemed, 30, exceptional);
  const payment = minimum(statutoryPayment, contractualPayment);
  const response = minimum(statutoryResponse, payment, contractualResponse);
  const status = (deadline: number, actual?: number) => actual !== undefined ? actual > deadline ? `實際遲 ${actual - deadline} 日` : "已於期限內記錄" : asOf > deadline ? `可能逾期 ${asOf - deadline} 日` : asOf === deadline ? "今天到期" : deadline - asOf <= 7 ? `期限將至（尚餘 ${deadline - asOf} 日）` : `尚餘 ${deadline - asOf} 日`;
  return {
    service: iso(service), deemed: iso(deemed), statutoryResponse: iso(statutoryResponse), response: iso(response),
    statutoryPayment: iso(statutoryPayment), payment: iso(payment),
    contractualResponse: contractualResponse === undefined ? null : iso(contractualResponse),
    contractualPayment: contractualPayment === undefined ? null : iso(contractualPayment),
    responseStatus: status(response, actualResponse), paymentStatus: status(payment, actualPayment),
    confirmed: Boolean(input.holidaysConfirmed),
    notes: [service < deemed ? "索償早於發單日，依第 18(2) 條視作在發單日送達。" : "以實際送達日為法定起算日。", service > (billing ?? service) ? "索償遲於發單日：只在合約期限以發單日計時，以實際送達日替代發單日。" : "", "30／60 日的中間日包括週末；第 71 條規定最後一日遇公眾假期、烈風或黑雨警告日順延。星期六本身不自動順延。"].filter(Boolean),
  };
}
