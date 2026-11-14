import { formatMoney } from "@/lib/format/money";

export function MoneyDisplay({
  amountIdr,
  expense = false,
  className = "",
}: {
  amountIdr: string;
  expense?: boolean;
  className?: string;
}) {
  return (
    <span className={`money ${className}`}>
      {expense ? "−" : ""}
      {formatMoney(amountIdr)}
    </span>
  );
}
