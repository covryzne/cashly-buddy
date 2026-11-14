import type { Category, Expense } from "@/mocks/fixtures/home";
import { formatDate } from "@/lib/format/datetime";
import { CategoryIcon } from "./category-icon";
import { MoneyDisplay } from "./money-display";

export function TransactionRow({
  expense,
  category,
  onSelect,
}: {
  expense: Expense;
  category: Category;
  onSelect: () => void;
}) {
  return (
    <button
      className="transaction-row"
      data-modal-focus-key={`expense:${expense.id}`}
      onClick={onSelect}
    >
      <CategoryIcon category={category} />
      <span className="transaction-copy">
        <strong>{expense.merchant}</strong>
        <small>
          {formatDate(expense.occurredAt, {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {expense.paymentMethod}
        </small>
      </span>
      <MoneyDisplay amountIdr={expense.amountIdr} expense />
    </button>
  );
}
