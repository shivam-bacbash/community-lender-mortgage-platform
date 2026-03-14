const FEDERAL_HOLIDAYS = new Set([
  "2025-01-01",
  "2025-01-20",
  "2025-02-17",
  "2025-05-26",
  "2025-06-19",
  "2025-07-04",
  "2025-09-01",
  "2025-10-13",
  "2025-11-11",
  "2025-11-27",
  "2025-12-25",
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-05-25",
  "2026-06-19",
  "2026-07-03",
  "2026-09-07",
  "2026-10-12",
  "2026-11-11",
  "2026-11-26",
  "2026-12-25",
  "2027-01-01",
  "2027-01-18",
  "2027-02-15",
  "2027-05-31",
  "2027-06-18",
  "2027-07-05",
  "2027-09-06",
  "2027-10-11",
  "2027-11-11",
  "2027-11-25",
  "2027-12-24",
]);

function normalizeDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isTRIDBusinessDay(date: Date) {
  const dayOfWeek = date.getUTCDay();
  if (dayOfWeek === 0) {
    return false;
  }

  return !FEDERAL_HOLIDAYS.has(normalizeDate(date));
}

export function addBusinessDays(startDate: Date, days: number) {
  if (days === 0) {
    return new Date(startDate);
  }

  const direction = days > 0 ? 1 : -1;
  let remaining = Math.abs(days);
  const current = new Date(startDate);

  while (remaining > 0) {
    current.setUTCDate(current.getUTCDate() + direction);
    if (isTRIDBusinessDay(current)) {
      remaining -= 1;
    }
  }

  return current;
}

export function calculateDisclosureDeadline(params: {
  disclosureType: "LE" | "CD";
  submittedAt?: string | null;
  closingDate?: string | null;
}) {
  if (params.disclosureType === "LE") {
    if (!params.submittedAt) {
      return null;
    }

    return addBusinessDays(new Date(params.submittedAt), 3);
  }

  if (!params.closingDate) {
    return null;
  }

  return addBusinessDays(new Date(params.closingDate), -3);
}

export function getDeadlineTone(deadline: string | null, acknowledgedAt: string | null) {
  if (acknowledgedAt) {
    return "success" as const;
  }

  if (!deadline) {
    return "neutral" as const;
  }

  const now = new Date();
  const due = new Date(deadline);
  const dayDiff = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  if (dayDiff < 0) {
    return "error" as const;
  }

  if (dayDiff <= 1) {
    return "warning" as const;
  }

  return "neutral" as const;
}
