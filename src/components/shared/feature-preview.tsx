import { Clock3, ListChecks, MousePointer2, ShieldCheck } from "lucide-react";

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
        Fitur ini akan dibuat pada tahap berikutnya. Sambil menunggu, kamu bisa
        menjelajahi data demo yang sudah tersedia.
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
      <p className="preview-note">
        <ShieldCheck size={18} />
        Belum ada data yang disimpan atau dikirim ke server.
      </p>
    </div>
  );
}
