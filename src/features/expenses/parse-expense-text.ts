import {
  blankReceipt,
  type ReceiptDraft,
} from "@/features/scan/receipt-schema";

export type ExpenseTextResult =
  | { kind: "ready"; draft: ReceiptDraft }
  | {
      kind: "clarify";
      reason: "name" | "amount" | "ambiguous";
      message: string;
    };

const priceAtEnd =
  /(?:^|[\s@])((?:rp\.?\s*)?\d[\d.,]*\s*(?:k|rb|ribu|jt|juta)?(?:\s*rupiah)?)$/i;
const amountOnly =
  /^(?:rp\.?\s*)?([\d.,]+)\s*(k|rb|ribu|jt|juta)?(?:\s*rupiah)?$/i;
const leadingWords =
  /^(?:(?:aku|saya|habis|baru|barusan|tadi|beli|membeli|bayar|membayar|catat|untuk)\s+)+/i;

function rupiah(value: string): string | null {
  const match = value.trim().match(amountOnly);
  if (!match) return null;
  const suffix = match[2]?.toLowerCase();
  const multiplier =
    suffix === "jt" || suffix === "juta"
      ? BigInt(1000000)
      : suffix
        ? BigInt(1000)
        : BigInt(1);
  let number = match[1];
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(number))
    number = number.replace(/[.,]/g, "");
  else number = number.replace(",", ".");
  if (!/^\d+(?:\.\d{1,3})?$/.test(number)) return null;
  const [integer, fraction = ""] = number.split(".");
  const denominator = BigInt(10) ** BigInt(fraction.length);
  const numerator = BigInt(integer + fraction) * multiplier;
  if (numerator % denominator !== BigInt(0)) return null;
  const result = numerator / denominator;
  return result > BigInt(0) && result.toString().length <= 12
    ? result.toString()
    : null;
}

function category(name: string) {
  if (
    /\b(kopi|coffee|nescafe|makan|nasi|roti|teh|susu|ayam|bakso|mie|minum|snack|camilan|air mineral)\b/i.test(
      name,
    )
  )
    return "food_drink";
  if (
    /\b(ojek|gojek|grab|bensin|parkir|tol|mrt|bus|kereta|angkot)\b/i.test(name)
  )
    return "transport";
  if (/\b(listrik|air|internet|wifi|pulsa|tagihan|pln|pdam)\b/i.test(name))
    return "bills";
  if (/\b(bioskop|film|game|netflix|spotify|konser|tiket)\b/i.test(name))
    return "entertainment";
  return "";
}

/** Local prototype adapter. No model/API, persistence, or client-authored reward. */
export function parseExpenseText(
  input: string,
  initial: ReceiptDraft = blankReceipt(),
): ExpenseTextResult {
  const clarify = (
    reason: "name" | "amount" | "ambiguous",
    message: string,
  ): ExpenseTextResult => ({ kind: "clarify", reason, message });
  let text = input.trim().replace(/[.!?]+$/, "");
  if (!text || text.length > 1000)
    return clarify(
      "ambiguous",
      "Tulis catatan singkat, maksimal 1.000 karakter, ya.",
    );
  if (
    /\b(gaji|pemasukan|pendapatan|saldo|refund|pengembalian dana|transfer antar)\b/i.test(
      text,
    )
  )
    return clarify(
      "ambiguous",
      "Mochi membantu mencatat pengeluaran. Ceritakan pembelian atau pembayaranmu, ya.",
    );
  if (/(?:^|\s)-\s*\d|\d\s*[eE][+-]?\d|\$|\b(usd|dollar|dolar)\b/.test(text))
    return clarify(
      "ambiguous",
      "Gunakan nominal rupiah positif, misalnya 12k atau Rp12.000.",
    );
  const draft = {
    ...initial,
    items: [] as ReceiptDraft["items"],
    discountIdr: "0",
    taxIdr: "0",
  };
  if (/\bkemarin\b/i.test(text)) {
    const previous = new Date(`${draft.occurredDate}T12:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    draft.occurredDate = previous.toISOString().slice(0, 10);
  }
  text = text.replace(/\b(kemarin|hari ini)\b/gi, "").trim();
  const payment = text.match(
    /\s+(?:(?:pakai|via|dengan)\s+)?(qris|tunai|cash|kartu debit|debit|transfer bank|dompet digital)$/i,
  );
  if (payment) {
    const method = payment[1].toLowerCase();
    draft.paymentMethod = (
      {
        qris: "QRIS",
        tunai: "Tunai",
        cash: "Tunai",
        debit: "Kartu debit",
        "kartu debit": "Kartu debit",
        "transfer bank": "Transfer bank",
        "dompet digital": "Dompet digital",
      } as Record<string, string>
    )[method];
    text = text.slice(0, payment.index).trim();
  }
  const parts = text
    .split(/\n|;|\s+dan\s+|,\s+(?=[A-Za-z])/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length)
    return clarify(
      "name",
      "Pembeliannya apa, ya? Tulis nama barang dan nominalnya.",
    );
  if (parts.length > 50)
    return clarify(
      "ambiguous",
      "Maksimal 50 item sekali catat. Pisahkan menjadi beberapa catatan, ya.",
    );
  const categories = new Set<string>();
  const merchants = new Set<string>();
  for (const [index, original] of parts.entries()) {
    let part = original;
    let merchantName = "";
    const trailingMerchant = part.match(/\s+di\s+([A-Za-z][\w\s.&'-]{0,99})$/i);
    if (
      trailingMerchant &&
      priceAtEnd.test(part.slice(0, trailingMerchant.index))
    ) {
      merchantName = trailingMerchant[1].trim();
      part = part.slice(0, trailingMerchant.index).trim();
    }
    const price = part.match(priceAtEnd);
    if (!price)
      return clarify(
        "amount",
        "Nominalnya berapa, ya? Contohnya: Nescafe coffee 12k.",
      );
    const priceIdr = rupiah(price[1]);
    if (!priceIdr)
      return clarify(
        "ambiguous",
        "Nominalnya belum jelas. Gunakan rupiah bulat, misalnya 12.500 atau 12,5k.",
      );
    let name = part.slice(0, price.index).trim().replace(leadingWords, "");
    const perUnit =
      /@|masing-masing|per item/i.test(name) || price[0].trim().startsWith("@");
    name = name.replace(/(?:@|masing-masing|per item|total)\s*$/i, "").trim();
    if (/\b(?:rp\.?\s*\d|\d[\d.,]*\s*(?:k|rb|ribu|jt|juta))\b/i.test(name))
      return clarify(
        "ambiguous",
        "Ada beberapa nominal dalam satu bagian. Pisahkan tiap pembelian dengan baris baru atau kata dan, ya.",
      );
    let quantity = "1";
    const count = name.match(/^(\d+)(?:\s*[x×]\s*|\s+)(.+)$/i);
    if (perUnit && count) {
      if (BigInt(count[1]) < BigInt(1) || BigInt(count[1]) > BigInt(99))
        return clarify(
          "ambiguous",
          "Jumlah tiap item harus 1–99. Kamu bisa mengaturnya lagi di rincian.",
        );
      quantity = BigInt(count[1]).toString();
      name = count[2].trim();
    }
    const merchant = name.match(/\s+di\s+(.+)$/i);
    if (merchant) {
      merchantName = merchant[1].trim();
      name = name.slice(0, merchant.index).trim();
    }
    if (merchantName) merchants.add(merchantName.toLowerCase());
    if (merchants.size > 1)
      return clarify(
        "ambiguous",
        "Ada pembelian dari beberapa toko. Catat setiap toko secara terpisah, ya.",
      );
    if (merchantName) draft.merchant = merchantName;
    if (!name || !/[A-Za-zÀ-ÿ]/.test(name))
      return clarify(
        "name",
        "Pembeliannya apa, ya? Tulis nama barang atau pembayarannya.",
      );
    if (name.length > 100 || draft.merchant.length > 100)
      return clarify(
        "ambiguous",
        "Nama barang atau tokonya terlalu panjang. Ringkas menjadi maksimal 100 karakter, ya.",
      );
    const code = category(name);
    if (code) categories.add(code);
    draft.items.push({ id: `chat-${index + 1}`, name, quantity, priceIdr });
  }
  draft.categoryCode = categories.size === 1 ? [...categories][0] : "";
  return { kind: "ready", draft };
}
