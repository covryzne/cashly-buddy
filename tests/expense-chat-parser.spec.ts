import { test, expect } from "@playwright/test";
import { parseExpenseText } from "../src/features/expenses/parse-expense-text";
import {
  receiptAmounts,
  blankReceipt,
} from "../src/features/scan/receipt-schema";

for (const [text, expected] of [
  ["habis beli Nescafe coffee 12k", "12000"],
  ["kopi Rp12.000", "12000"],
  ["kopi 12rb", "12000"],
  ["kopi 12 ribu", "12000"],
  ["kopi 12,5k", "12500"],
  ["kopi 12.5rb", "12500"],
  ["kopi 12.500", "12500"],
  ["tagihan 1,5jt", "1500000"],
  ["tagihan Rp1.250.000", "1250000"],
] as const) {
  test(`Nominal ${text} menjadi ${expected} rupiah`, () => {
    const result = parseExpenseText(text);
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") throw new Error(result.message);
    expect(receiptAmounts(result.draft).total.toString()).toBe(expected);
  });
}

test("Banyak item dan jumlah eksplisit tidak kehilangan nominal", () => {
  const result = parseExpenseText(
    "beli 2 Nescafe coffee @12k dan roti 8k pakai QRIS",
  );
  if (result.kind !== "ready") throw new Error(result.message);
  expect(result.draft.items).toHaveLength(2);
  expect(result.draft.items[0]).toMatchObject({
    name: "Nescafe coffee",
    quantity: "2",
    priceIdr: "12000",
  });
  expect(result.draft.paymentMethod).toBe("QRIS");
  expect(result.draft.categoryCode).toBe("food_drink");
  expect(receiptAmounts(result.draft).total.toString()).toBe("32000");
});

test("Nominal total tidak dikalikan lagi ketika jumlah tidak menyebut harga satuan", () => {
  const result = parseExpenseText("beli 2 kopi total 24k");
  if (result.kind !== "ready") throw new Error(result.message);
  expect(result.draft.items[0]).toMatchObject({
    name: "2 kopi",
    quantity: "1",
    priceIdr: "24000",
  });
});

test("Merchant, kemarin WIB dan kategori yang belum diketahui tetap dapat dikoreksi", () => {
  const seed = { ...blankReceipt(), occurredDate: "2026-11-14" };
  const result = parseExpenseText("kemarin beli kaos di Toko Satu 100k", seed);
  if (result.kind !== "ready") throw new Error(result.message);
  expect(result.draft.merchant).toBe("Toko Satu");
  expect(result.draft.items[0].name).toBe("kaos");
  expect(result.draft.categoryCode).toBe("");
  expect(result.draft.occurredDate).toBe("2026-11-13");
});

for (const text of [
  "hari ini",
  "kopi 12k di Toko A dan roti 8k di Toko B",
  "Nescafe coffee",
  "12k",
  "kopi 0k",
  "kopi -12k",
  "kopi 12,5",
  "kopi 12k diskon 2k",
  "gaji 5jt",
  "saldo 200rb",
  "kopi USD12",
  "kopi 1000000000000",
]) {
  test(`Minta klarifikasi untuk ${text}`, () => {
    expect(parseExpenseText(text).kind).toBe("clarify");
  });
}

test("Merchant sesudah harga tidak menghilangkan item lain", () => {
  const result = parseExpenseText("kopi 12k di Toko A dan roti 8k di Toko A");
  if (result.kind !== "ready") throw new Error(result.message);
  expect(result.draft.items).toHaveLength(2);
  expect(result.draft.merchant).toBe("Toko A");
  expect(receiptAmounts(result.draft).total.toString()).toBe("20000");
});

test("Air mineral dikenali sebagai minuman", () => {
  const result = parseExpenseText("air mineral 5k");
  if (result.kind !== "ready") throw new Error(result.message);
  expect(result.draft.categoryCode).toBe("food_drink");
});
