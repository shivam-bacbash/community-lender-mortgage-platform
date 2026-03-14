import type { QMResult } from "@/types/compliance";

const APOR_BASELINES: Record<string, number> = {
  conventional: 6.5,
  fha: 6.25,
  va: 6.1,
  usda: 6.1,
  jumbo: 6.8,
};

export function getAporBaseline(loanType: string) {
  return APOR_BASELINES[loanType] ?? 6.5;
}

export function checkQMEligibility(input: {
  dti: number | null;
  points: number | null;
  termMonths: number | null;
  amortizationType: string | null;
  loanAmount: number | null;
  apr: number | null;
  apor?: number | null;
}): QMResult {
  const apor = input.apor ?? (input.loanAmount ? getAporBaseline("conventional") : null);
  const rateSpread =
    input.apr !== null && input.apr !== undefined && apor !== null ? input.apr - apor : null;

  const checks = [
    { name: "Max DTI", passed: input.dti !== null ? input.dti <= 0.43 : false, value: input.dti },
    { name: "Max Points", passed: input.points !== null ? input.points <= 3 : false, value: input.points },
    {
      name: "Max Term",
      passed: input.termMonths !== null ? input.termMonths <= 360 : false,
      value: input.termMonths,
    },
    {
      name: "No IO/Neg-Am",
      passed: (input.amortizationType ?? "fixed") === "fixed",
      value: input.amortizationType ?? "fixed",
    },
    {
      name: "Max Loan",
      passed: input.loanAmount !== null ? input.loanAmount <= 726200 : false,
      value: input.loanAmount,
    },
  ];

  return {
    isQM: checks.every((check) => check.passed),
    isHPML: rateSpread !== null ? rateSpread > 1.5 : false,
    isHOEPA: rateSpread !== null ? rateSpread > 8 : false,
    apor,
    rateSpread,
    checks,
  };
}
