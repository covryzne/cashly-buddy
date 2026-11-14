import { BookOpen, Sparkles, ClipboardList } from "lucide-react";
import type { Category } from "@/mocks/fixtures/home";
import { MoneyDisplay } from "./money-display";
import { CategoryIcon } from "./category-icon";

export function WeeklyStory({
  totalIdr,
  count,
  categories,
}: {
  totalIdr: string;
  count: number;
  categories: Category[];
}) {
  const ranked = [...categories]
    .filter((category) => BigInt(category.amountIdr) > BigInt(0))
    .sort((a, b) => (BigInt(a.amountIdr) > BigInt(b.amountIdr) ? -1 : 1));
  return (
    <article className="weekly-story">
      <div className="story-intro">
        <span className="story-icon">
          <BookOpen size={26} />
        </span>
        <div>
          <span className="receipt-eyebrow">Pratinjau mingguan</span>
          <h3>Seminggu, satu cerita kecil.</h3>
          <p>Yuk, lihat kembali catatan pengeluaranmu.</p>
        </div>
      </div>
      <div className="story-summary">
        <span>Total pengeluaran</span>
        <MoneyDisplay amountIdr={totalIdr} />
        <small>{count} transaksi dalam 7 hari · WIB</small>
      </div>
      <div className="story-list-heading">
        <h3>Jejak pengeluaranmu</h3>
        <span>{ranked.length} kategori</span>
      </div>
      <ul className="story-categories">
        {ranked.map((category, index) => (
          <li key={category.code}>
            <CategoryIcon category={category} />
            <span>
              <strong>{category.label}</strong>
              {index === 0 && <small>Porsi terbesar minggu ini</small>}
            </span>
            <MoneyDisplay amountIdr={category.amountIdr} />
          </li>
        ))}
      </ul>
      <div className="story-reflection">
        <Sparkles size={19} />
        <div>
          <h3>Satu hal yang kamu ingat?</h3>
          <p>
            Catatan mana yang paling mewakili minggumu? Kamu bisa meninjaunya
            dari daftar transaksi di Beranda.
          </p>
        </div>
      </div>
      <p className="preview-note">
        <ClipboardList size={18} />
        Pratinjau data demo. Misi tetap belum direview; membuka cerita tidak
        menambah XP atau streak.
      </p>
    </article>
  );
}
