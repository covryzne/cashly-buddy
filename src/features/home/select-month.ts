import { homeFixture } from "@/mocks/fixtures/home";
import { formatDate } from "@/lib/format/datetime";
import { dateKey, rangeLabel, type PeriodSelection } from "@/lib/format/period";

export function monthKey(value = new Date().toISOString()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(value));
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`;
}

// Fixture selectors only. Canonical financial totals will come from the API.
export function selectWeeklyStory() {
  const end = dateKey(homeFixture.asOf);
  const start = new Date(`${end}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  return selectPeriod({
    kind: "range",
    start: start.toISOString().slice(0, 10),
    end,
  });
}

export function selectMonth(month: string) {
  return selectPeriod({ kind: "month", month });
}

export function selectPeriod(selection: PeriodSelection) {
  const expenses = homeFixture.expenses.filter((expense) =>
    selection.kind === "month"
      ? monthKey(expense.occurredAt) === selection.month
      : dateKey(expense.occurredAt) >= selection.start &&
        dateKey(expense.occurredAt) <= selection.end,
  );
  const monthLabel =
    selection.kind === "month"
      ? formatDate(`${selection.month}-01T00:00:00+07:00`, {
          month: "long",
          year: "numeric",
        })
      : rangeLabel(selection.start, selection.end);
  return {
    expenses,
    monthLabel,
    totalIdr: expenses
      .reduce((sum, expense) => sum + BigInt(expense.amountIdr), BigInt(0))
      .toString(),
    count: expenses.length,
    period:
      selection.kind === "month" &&
      selection.month === monthKey(homeFixture.asOf)
        ? homeFixture.period
        : monthLabel,
    categories: homeFixture.categories.map((category) => ({
      ...category,
      amountIdr: expenses
        .filter((expense) => expense.categoryCode === category.code)
        .reduce((sum, expense) => sum + BigInt(expense.amountIdr), BigInt(0))
        .toString(),
    })),
  };
}
