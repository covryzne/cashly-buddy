const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatMoney(amountIdr: string): string {
  if (!/^\d+$/.test(amountIdr))
    throw new Error("Nominal harus berupa bilangan bulat positif.");
  return rupiah.format(BigInt(amountIdr)).replace(/\s/g, "");
}
