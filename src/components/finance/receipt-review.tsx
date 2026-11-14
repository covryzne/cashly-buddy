import Image from "next/image";
import { useRef, type ReactNode } from "react";
import {
  CreditCard,
  MessageCircle,
  Mic,
  Plus,
  ReceiptText,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { homeFixture } from "@/mocks/fixtures/home";
import {
  paymentMethods,
  receiptAmounts,
  type ReceiptDraft,
  type ReceiptPhoto,
} from "@/features/scan/receipt-schema";
import { MoneyDisplay } from "./money-display";
import { DatePickerTime } from "./date-picker-time";

function Field({
  label,
  name,
  error,
  children,
}: {
  label: ReactNode;
  name: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="scan-field">
      <label htmlFor={`scan-${name}`}>{label}</label>
      {children}
      {error && (
        <small id={`scan-error-${name}`} className="scan-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

export function ReceiptReview({
  draft,
  photo,
  text,
  textSource = "chat",
  manual = false,
  errors,
  formId,
  onChange,
  onSubmit,
  onRetake,
}: {
  draft: ReceiptDraft;
  photo?: ReceiptPhoto;
  text?: string;
  textSource?: "chat" | "voice";
  manual?: boolean;
  errors: Record<string, string>;
  formId: string;
  onChange: (draft: ReceiptDraft) => void;
  onSubmit: () => void;
  onRetake: () => void;
}) {
  const nextId = useRef(0);
  const amounts = receiptAmounts(draft);
  const fieldProps = (name: string) => ({
    id: `scan-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `scan-error-${name}` : undefined,
  });
  const update = (name: keyof ReceiptDraft, value: string) =>
    onChange({ ...draft, [name]: value });
  const updateItem = (
    index: number,
    key: "name" | "quantity" | "priceIdr",
    value: string,
  ) =>
    onChange({
      ...draft,
      items: draft.items.map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    });
  return (
    <form
      id={formId}
      className="receipt-review"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="scan-photo-summary">
        {photo?.url ? (
          <Image
            src={photo.url}
            unoptimized
            alt="Foto struk untuk ditinjau"
            width={56}
            height={72}
          />
        ) : (
          <span className="scan-sample-thumb">
            {text !== undefined ? (
              textSource === "voice" ? (
                <Mic size={30} />
              ) : (
                <MessageCircle size={30} />
              )
            ) : (
              <ReceiptText size={30} />
            )}
          </span>
        )}
        <div>
          <span className="pill">
            {text !== undefined
              ? textSource === "voice"
                ? "Catatan dari voice note"
                : "Catatan dari chat"
              : manual
                ? "Input manual"
                : photo?.source === "example"
                  ? "Struk contoh"
                  : photo?.source === "camera"
                    ? "Foto struk siap"
                    : "Foto siap ditinjau"}
          </span>
          <p>
            {text !== undefined
              ? text ||
                "Transkrip belum tersedia. Tambahkan transkrip atau lengkapi rincian di bawah."
              : manual
                ? "Isi nama toko, item, dan nominal sendiri. Rincian tidak diisi otomatis."
                : photo?.source === "example"
                  ? "Periksa nama toko, nominal, dan rincian item sebelum melanjutkan."
                  : photo?.source === "camera"
                    ? "Foto berhasil diambil. Periksa dan sesuaikan rincian dengan strukmu."
                    : "Lengkapi rincian sesuai foto strukmu."}
          </p>
        </div>
        <button type="button" className="text-button" onClick={onRetake}>
          {text !== undefined
            ? textSource === "voice"
              ? "Ubah transkrip"
              : "Ubah pesan"
            : "Ulang"}
        </button>
      </div>
      {Object.keys(errors).length > 0 && (
        <p className="scan-form-alert" role="alert">
          Periksa isian yang ditandai sebelum melanjutkan.
        </p>
      )}
      <section
        className="scan-card scan-merchant-card"
        aria-label="Informasi pengeluaran"
      >
        <div className="scan-section-title">
          <span className="category-icon tone-peach">
            <ShoppingBag size={21} />
          </span>
          <h3>Rincian pengeluaran</h3>
        </div>
        <Field
          label="Merchant (opsional)"
          name="merchant"
          error={errors.merchant}
        >
          <Input
            {...fieldProps("merchant")}
            value={draft.merchant}
            maxLength={100}
            placeholder="Nama toko atau merchant"
            onChange={(event) => update("merchant", event.target.value)}
          />
        </Field>
        <div className="scan-review-total">
          <small>Total pengeluaran</small>
          <MoneyDisplay
            amountIdr={(amounts.total > BigInt(0)
              ? amounts.total
              : BigInt(0)
            ).toString()}
          />
          <span>IDR</span>
        </div>
        <Field label="Kategori" name="categoryCode" error={errors.categoryCode}>
          <select
            {...fieldProps("categoryCode")}
            value={draft.categoryCode}
            onChange={(event) => update("categoryCode", event.target.value)}
          >
            <option value="">Pilih kategori</option>
            {homeFixture.categories.map((category) => (
              <option value={category.code} key={category.code}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>
      </section>
      <section
        className="scan-card scan-items-card"
        aria-labelledby="scan-items-title"
      >
        <div className="scan-section-title">
          <ReceiptText size={18} />
          <h3 id="scan-items-title">
            Rincian item{" "}
            <span className="scan-item-count">{draft.items.length}</span>
          </h3>
          <button
            type="button"
            className="text-button scan-add-item"
            disabled={draft.items.length >= 50}
            onClick={() =>
              onChange({
                ...draft,
                items: [
                  ...draft.items,
                  {
                    id: `added-${++nextId.current}`,
                    name: "",
                    quantity: "1",
                    priceIdr: "",
                  },
                ],
              })
            }
          >
            <Plus size={15} />
            Tambah
          </button>
        </div>
        {errors.items && <p className="scan-field-error">{errors.items}</p>}
        <ol className="scan-items">
          {draft.items.map((item, index) => (
            <li key={item.id}>
              <div className="scan-item-heading">
                <label className="scan-item-name">
                  <span className="sr-only">Nama item {index + 1}</span>
                  <Input
                    {...fieldProps(`items.${index}.name`)}
                    value={item.name}
                    maxLength={100}
                    placeholder="Nama produk"
                    onChange={(event) =>
                      updateItem(index, "name", event.target.value)
                    }
                  />
                </label>
                <button
                  type="button"
                  className="icon-button scan-item-remove"
                  aria-label={`Hapus item ${index + 1}`}
                  onClick={() =>
                    onChange({
                      ...draft,
                      items: draft.items.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {errors[`items.${index}.name`] && (
                <small
                  id={`scan-error-items.${index}.name`}
                  className="scan-field-error"
                >
                  {errors[`items.${index}.name`]}
                </small>
              )}
              <div className="scan-item-values">
                <Field
                  label={
                    <>
                      Jumlah<span className="sr-only"> item {index + 1}</span>
                    </>
                  }
                  name={`items.${index}.quantity`}
                  error={errors[`items.${index}.quantity`]}
                >
                  <Input
                    {...fieldProps(`items.${index}.quantity`)}
                    inputMode="numeric"
                    value={item.quantity}
                    maxLength={2}
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                  />
                </Field>
                <Field
                  label={
                    <>
                      Harga satuan
                      <span className="sr-only"> item {index + 1}</span>
                    </>
                  }
                  name={`items.${index}.priceIdr`}
                  error={errors[`items.${index}.priceIdr`]}
                >
                  <div className="scan-item-price">
                    <span aria-hidden="true">Rp</span>
                    <Input
                      {...fieldProps(`items.${index}.priceIdr`)}
                      inputMode="numeric"
                      value={item.priceIdr}
                      maxLength={12}
                      placeholder="0"
                      onChange={(event) =>
                        updateItem(index, "priceIdr", event.target.value)
                      }
                    />
                  </div>
                </Field>
              </div>
            </li>
          ))}
        </ol>
        {draft.items.length === 0 && (
          <p className="scan-empty-items">
            Tambahkan satu item sesuai strukmu untuk melanjutkan.
          </p>
        )}
        <div className="scan-adjustments">
          <Field
            label="Diskon / kupon (Rp)"
            name="discountIdr"
            error={errors.discountIdr}
          >
            <Input
              {...fieldProps("discountIdr")}
              inputMode="numeric"
              value={draft.discountIdr}
              maxLength={12}
              onChange={(event) => update("discountIdr", event.target.value)}
            />
          </Field>
          <Field
            label="Pajak tambahan (Rp)"
            name="taxIdr"
            error={errors.taxIdr}
          >
            <Input
              {...fieldProps("taxIdr")}
              inputMode="numeric"
              value={draft.taxIdr}
              maxLength={12}
              onChange={(event) => update("taxIdr", event.target.value)}
            />
          </Field>
        </div>
        <p className="scan-field-hint">
          Isi pajak tambahan hanya jika belum termasuk harga item.
        </p>
        <dl className="scan-totals">
          <div>
            <dt>Subtotal {draft.items.length} item</dt>
            <dd>
              <MoneyDisplay amountIdr={amounts.subtotal.toString()} />
            </dd>
          </div>
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
              <MoneyDisplay
                amountIdr={(amounts.total > BigInt(0)
                  ? amounts.total
                  : BigInt(0)
                ).toString()}
              />
            </dd>
          </div>
        </dl>
      </section>
      <section className="scan-card" aria-label="Pembayaran dan waktu">
        <div className="scan-section-title">
          <CreditCard size={18} />
          <h3>Pembayaran & waktu</h3>
        </div>
        <Field
          label="Metode pembayaran (opsional)"
          name="paymentMethod"
          error={errors.paymentMethod}
        >
          <select
            {...fieldProps("paymentMethod")}
            value={draft.paymentMethod}
            onChange={(event) => update("paymentMethod", event.target.value)}
          >
            <option value="">Belum dipilih</option>
            {paymentMethods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </Field>
        <DatePickerTime
          date={draft.occurredDate}
          time={draft.occurredTime}
          dateId="scan-occurredDate"
          timeId="scan-occurredTime"
          dateError={errors.occurredDate}
          timeError={errors.occurredTime}
          onDateChange={(value) => update("occurredDate", value)}
          onTimeChange={(value) => update("occurredTime", value)}
        />
      </section>
    </form>
  );
}
