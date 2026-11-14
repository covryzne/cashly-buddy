import Image from "next/image";
import { Check, Clock3, ReceiptText, ShieldCheck } from "lucide-react";
import { homeFixture } from "@/mocks/fixtures/home";
import { formatDate, wibDateTime } from "@/lib/format/datetime";
import {
  previewInteger,
  receiptAmounts,
  type ReceiptDraft,
} from "@/features/scan/receipt-schema";
import { MoneyDisplay } from "./money-display";
import { CategoryIcon } from "./category-icon";

export function ReceiptScanSuccess({ draft }: { draft: ReceiptDraft }) {
  const category = homeFixture.categories.find(
    (entry) => entry.code === draft.categoryCode,
  )!;
  const amounts = receiptAmounts(draft);
  return (
    <div className="scan-success">
      <section className="scan-success-hero">
        <div className="scan-success-mochi">
          <Image
            src="/mascot/mochi-crown-transparent.webp"
            alt="Mochi tersenyum"
            width={112}
            height={112}
          />
          <span>
            <Check size={19} />
          </span>
        </div>
        <span className="pill">
          <ShieldCheck size={14} />
          Selesai
        </span>
        <h3>Catatanmu siap!</h3>
        <p>
          Pengeluaran <MoneyDisplay amountIdr={amounts.total.toString()} />
          {draft.merchant ? ` di ${draft.merchant}` : ""}.
        </p>
      </section>
      <section
        className="scan-card"
        aria-label="Rincian transaksi hasil review"
      >
        <div className="scan-section-title">
          <ReceiptText size={18} />
          <h3>Rincian transaksi</h3>
          <span className="pill">{draft.items.length} item</span>
        </div>
        <div className="scan-success-merchant">
          <CategoryIcon category={category} />
          <div>
            <strong>{draft.merchant || "Tanpa merchant"}</strong>
            <small>
              {category.label} ·{" "}
              {draft.paymentMethod || "Pembayaran belum dipilih"}
            </small>
          </div>
          <MoneyDisplay amountIdr={amounts.total.toString()} expense />
        </div>
        <ul className="scan-success-items">
          {draft.items.map((item) => (
            <li key={item.id}>
              <span>
                {item.quantity} × {item.name}
              </span>
              <MoneyDisplay
                amountIdr={(
                  previewInteger(item.quantity) * previewInteger(item.priceIdr)
                ).toString()}
              />
            </li>
          ))}
        </ul>
        <dl className="scan-totals">
          <div>
            <dt>Diskon</dt>
            <dd>
              −<MoneyDisplay amountIdr={amounts.discount.toString()} />
            </dd>
          </div>
          <div>
            <dt>Pajak tambahan</dt>
            <dd>
              <MoneyDisplay amountIdr={amounts.tax.toString()} />
            </dd>
          </div>
          <div className="scan-grand-total">
            <dt>Total akhir</dt>
            <dd>
              <MoneyDisplay amountIdr={amounts.total.toString()} />
            </dd>
          </div>
        </dl>
        <p className="scan-success-date">
          <Clock3 size={14} />
          {formatDate(wibDateTime(draft.occurredDate, draft.occurredTime), {
            dateStyle: "medium",
            timeStyle: draft.occurredTime.length === 8 ? "medium" : "short",
          })}{" "}
          WIB
        </p>
      </section>
    </div>
  );
}
