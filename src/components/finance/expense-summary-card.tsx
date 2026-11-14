import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyDisplay } from "./money-display";

export function ExpenseSummaryCard({
  totalIdr,
  period,
  count,
  onAdd,
  onPeriod,
  isCurrentMonth = true,
}: {
  totalIdr: string;
  period: string;
  count: number;
  onAdd: () => void;
  onPeriod: () => void;
  isCurrentMonth?: boolean;
}) {
  return (
    <section className="card expense-summary" aria-labelledby="summary-title">
      <div className="section-heading">
        <h2 id="summary-title" className="eyebrow">
          {isCurrentMonth ? "Pengeluaran bulan ini" : "Pengeluaran periode ini"}
        </h2>
        <button
          className="icon-button period-trigger"
          onClick={onPeriod}
          aria-label="Pilih periode pengeluaran"
          aria-haspopup="dialog"
        >
          <CalendarDays size={19} aria-hidden="true" />
        </button>
      </div>
      <MoneyDisplay amountIdr={totalIdr} className="hero-amount" />
      <div className="summary-meta">
        <span>{count} transaksi tercatat</span>
        <span>{period}</span>
      </div>
      <Button onClick={onAdd}>
        <Plus size={20} />
        Catat pengeluaran
      </Button>
    </section>
  );
}
