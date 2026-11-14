import {
  CalendarDays,
  Check,
  CreditCard,
  NotebookText,
  PencilLine,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import type { Category, Expense } from "@/mocks/fixtures/home";
import { formatDate } from "@/lib/format/datetime";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "./category-icon";
import { MoneyDisplay } from "./money-display";

export function ExpenseDetail({
  expense,
  category,
  period,
}: {
  expense: Expense;
  category: Category;
  period: string;
}) {
  return (
    <div className="expense-detail-view">
      <div className="receipt-context">
        <span className="pill dialog-demo">
          <Sparkles size={12} />
          {period}
        </span>
        <span className="receipt-status">
          <ShieldCheck size={13} />
          Tercatat
        </span>
      </div>
      <article className="expense-receipt">
        <header className="receipt-merchant">
          <CategoryIcon category={category} />
          <div>
            <span className="receipt-eyebrow">Pengeluaran</span>
            <h3>{expense.merchant}</h3>
          </div>
        </header>
        <div className="receipt-amount">
          <MoneyDisplay
            amountIdr={expense.amountIdr}
            expense
            className="detail-amount"
          />
          <span className="receipt-currency">IDR</span>
        </div>
        <p className="receipt-description">{expense.description}</p>
        <aside className="receipt-encouragement">
          <span className="receipt-sparkle">
            <Sparkles size={20} />
          </span>
          <div>
            <strong>Setiap catatan berarti.</strong>
            <small>Check-in dihitung sekali sehari.</small>
          </div>
          <span className="receipt-buddy">Mochi</span>
        </aside>
        <div className="receipt-meta-panel">
          <dl className="receipt-metadata">
            <div>
              <dt>
                <Tag size={17} />
                Kategori
              </dt>
              <dd>
                <span className="receipt-category">{category.label}</span>
              </dd>
            </div>
            <div>
              <dt>
                <CreditCard size={17} />
                Pembayaran
              </dt>
              <dd>
                <span className="receipt-payment">
                  {expense.paymentMethod === "QRIS" && <QrCode size={13} />}
                  {expense.paymentMethod}
                </span>
              </dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={17} />
                Waktu (WIB)
              </dt>
              <dd>
                <time dateTime={expense.occurredAt}>
                  {formatDate(expense.occurredAt, { dateStyle: "medium" })}
                  <small>
                    {formatDate(expense.occurredAt, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </small>
                </time>
              </dd>
            </div>
          </dl>
          <section className="receipt-note" aria-label="Catatan transaksi">
            <h4>
              <NotebookText size={17} />
              Catatan
            </h4>
            <p>Belum ada catatan tambahan.</p>
          </section>
        </div>
      </article>
    </div>
  );
}

export function ExpenseDetailActions({ onDone }: { onDone: () => void }) {
  return (
    <div className="receipt-actions">
      <Button disabled title="Pengeditan belum tersedia">
        <PencilLine size={18} />
        Ubah detail
      </Button>
      <button
        className="icon-button receipt-done"
        aria-label="Selesai melihat detail"
        onClick={onDone}
      >
        <Check size={21} />
      </button>
    </div>
  );
}
