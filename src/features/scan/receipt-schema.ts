import { z } from "zod";
import { homeFixture } from "@/mocks/fixtures/home";
import { dateKey } from "@/lib/format/period";
import { formatDate } from "@/lib/format/datetime";

const money = z
  .string()
  .regex(/^\d{1,12}$/, "Isi rupiah bulat, maksimal 12 digit.");
const localDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}, "Pilih tanggal yang valid.");
export const paymentMethods = [
  "QRIS",
  "Tunai",
  "Kartu debit",
  "Transfer bank",
  "Dompet digital",
];
export const receiptSchema = z
  .object({
    merchant: z
      .string()
      .trim()
      .max(100, "Nama merchant maksimal 100 karakter."),
    categoryCode: z
      .string()
      .refine(
        (code) =>
          homeFixture.categories.some((category) => category.code === code),
        "Pilih kategori pengeluaran.",
      ),
    paymentMethod: z
      .string()
      .refine(
        (value) => value === "" || paymentMethods.includes(value),
        "Pilih metode pembayaran yang tersedia.",
      ),
    occurredDate: localDate,
    occurredTime: z
      .string()
      .regex(
        /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/,
        "Pilih waktu yang valid.",
      ),
    items: z
      .array(
        z.object({
          id: z.string(),
          name: z
            .string()
            .trim()
            .min(1, "Isi nama item.")
            .max(100, "Nama item maksimal 100 karakter."),
          quantity: z.string().regex(/^[1-9]\d?$/, "Jumlah harus 1–99."),
          priceIdr: money,
        }),
      )
      .min(1, "Tambahkan minimal satu item.")
      .max(50, "Maksimal 50 item per struk."),
    discountIdr: money,
    taxIdr: money,
  })
  .superRefine((draft, context) => {
    const amounts = receiptAmounts(draft);
    if (amounts.total <= BigInt(0))
      context.addIssue({
        code: "custom",
        path: ["discountIdr"],
        message:
          "Total pengeluaran harus lebih dari Rp0. Periksa harga dan diskon.",
      });
  });
export type ReceiptDraft = z.infer<typeof receiptSchema>;
export type ReceiptPhoto = {
  url: string | null;
  source: "camera" | "gallery" | "example";
};
export const previewInteger = (value: string) =>
  /^\d{1,12}$/.test(value) ? BigInt(value) : BigInt(0);
export function receiptAmounts(draft: ReceiptDraft) {
  const subtotal = draft.items.reduce(
    (sum, item) =>
      sum + previewInteger(item.quantity) * previewInteger(item.priceIdr),
    BigInt(0),
  );
  const discount = previewInteger(draft.discountIdr);
  const tax = previewInteger(draft.taxIdr);
  return { subtotal, discount, tax, total: subtotal + tax - discount };
}
export function blankReceipt(): ReceiptDraft {
  const now = new Date().toISOString();
  return {
    merchant: "",
    categoryCode: "",
    paymentMethod: "",
    occurredDate: dateKey(now),
    occurredTime: formatDate(now, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).replace(".", ":"),
    items: [{ id: "first", name: "", quantity: "1", priceIdr: "" }],
    discountIdr: "0",
    taxIdr: "0",
  };
}
