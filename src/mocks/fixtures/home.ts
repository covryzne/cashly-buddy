export type Category = {
  code: string;
  label: string;
  icon: "food" | "transport" | "bills" | "entertainment";
  amountIdr: string;
  tone: "peach" | "mint" | "lavender" | "butter";
};
export type Expense = {
  id: string;
  merchant: string;
  description: string;
  categoryCode: string;
  amountIdr: string;
  occurredAt: string;
  paymentMethod: string;
};

// Fictional, read-only snapshots. These are not API responses or a game engine.
export const homeFixture = {
  name: "Nara",
  asOf: "2026-11-13T07:00:00Z",
  period: "1–13 November 2026",
  month: "November 2026",
  totalIdr: "1248500",
  transactionCount: 6,
  level: 4,
  xp: 340,
  streak: 12,
  mascotStage: 1,
  maxMascotStageUnlocked: 3,
  freezeBalance: 1,
  categories: [
    {
      code: "food_drink",
      label: "Makanan",
      icon: "food",
      amountIdr: "580000",
      tone: "peach",
    },
    {
      code: "transport",
      label: "Transportasi",
      icon: "transport",
      amountIdr: "320000",
      tone: "mint",
    },
    {
      code: "bills",
      label: "Tagihan",
      icon: "bills",
      amountIdr: "210000",
      tone: "lavender",
    },
    {
      code: "entertainment",
      label: "Hiburan",
      icon: "entertainment",
      amountIdr: "138500",
      tone: "butter",
    },
  ] satisfies Category[],
  expenses: [
    {
      id: "demo-1",
      merchant: "Kopi Sudut",
      description: "Kopi dan makan siang",
      categoryCode: "food_drink",
      amountIdr: "28000",
      occurredAt: "2026-11-13T06:45:00Z",
      paymentMethod: "QRIS",
    },
    {
      id: "demo-2",
      merchant: "MRT Jakarta",
      description: "Perjalanan pulang pergi",
      categoryCode: "transport",
      amountIdr: "320000",
      occurredAt: "2026-11-13T01:30:00Z",
      paymentMethod: "Kartu debit",
    },
    {
      id: "demo-3",
      merchant: "Token listrik",
      description: "Isi ulang listrik rumah",
      categoryCode: "bills",
      amountIdr: "210000",
      occurredAt: "2026-11-12T12:20:00Z",
      paymentMethod: "Transfer bank",
    },
    {
      id: "demo-4",
      merchant: "Dapur Bersama",
      description: "Pesanan makan bersama",
      categoryCode: "food_drink",
      amountIdr: "552000",
      occurredAt: "2026-11-10T05:00:00Z",
      paymentMethod: "QRIS",
    },
    {
      id: "demo-5",
      merchant: "Bioskop akhir pekan",
      description: "Tiket dan camilan",
      categoryCode: "entertainment",
      amountIdr: "100000",
      occurredAt: "2026-11-08T09:00:00Z",
      paymentMethod: "QRIS",
    },
    {
      id: "demo-6",
      merchant: "Musik bulanan",
      description: "Langganan musik",
      categoryCode: "entertainment",
      amountIdr: "38500",
      occurredAt: "2026-11-01T03:00:00Z",
      paymentMethod: "Dompet digital",
    },
  ] satisfies Expense[],
  calendar: [
    { date: "2026-11-07", day: "Sab", status: "active" },
    { date: "2026-11-08", day: "Min", status: "active" },
    { date: "2026-11-09", day: "Sen", status: "active" },
    { date: "2026-11-10", day: "Sel", status: "active" },
    { date: "2026-11-11", day: "Rab", status: "active" },
    { date: "2026-11-12", day: "Kam", status: "active" },
    { date: "2026-11-13", day: "Jum", status: "today" },
  ],
};
