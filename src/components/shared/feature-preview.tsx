import { Clock3, ListChecks, MousePointer2 } from "lucide-react";

export function FeaturePreview({ label }: { label: string }) {
  return (
    <div className="feature-preview">
      <div className="feature-preview-heading">
        <span className="story-icon">
          <Clock3 size={25} />
        </span>
        <div>
          <span className="receipt-eyebrow">Segera hadir</span>
          <h3>{label}</h3>
        </div>
      </div>
      <p>
        Kami sedang menyiapkan fitur ini. Sambil menunggu, kamu bisa meninjau
        catatan pengeluaranmu di Beranda.
      </p>
      <ul className="preview-options">
        <li>
          <ListChecks size={20} />
          <span>
            <strong>Tinjau catatanmu</strong>
            <small>Lihat nominal, kategori, dan waktu transaksi.</small>
          </span>
        </li>
        <li>
          <MousePointer2 size={20} />
          <span>
            <strong>Coba periode pilihanmu</strong>
            <small>Bandingkan tampilan bulan atau rentang tanggal.</small>
          </span>
        </li>
      </ul>
    </div>
  );
}
