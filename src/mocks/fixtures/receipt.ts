import type { ReceiptDraft } from "@/features/scan/receipt-schema";

// Demo details only, including the authorized post-capture prototype flow.
// Always label these as dummy data, never as actual extraction output.
export function exampleReceipt(): ReceiptDraft {
  return {
    merchant: "Indomaret Point",
    categoryCode: "food_drink",
    paymentMethod: "QRIS",
    occurredDate: "2026-11-13",
    occurredTime: "14:02",
    discountIdr: "0",
    taxIdr: "0",
    items: [
      {
        id: "example-1",
        name: "Oatside Barista 200ml",
        quantity: "1",
        priceIdr: "9500",
      },
      {
        id: "example-2",
        name: "Roti tawar gandum",
        quantity: "1",
        priceIdr: "18000",
      },
      {
        id: "example-3",
        name: "Ultra Milk karamel 200ml",
        quantity: "1",
        priceIdr: "7000",
      },
      {
        id: "example-4",
        name: "Chitato Lite seaweed",
        quantity: "1",
        priceIdr: "13000",
      },
    ],
  };
}
