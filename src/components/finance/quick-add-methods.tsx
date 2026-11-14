import Image from "next/image";
import { ArrowRight, ScanLine, Mic, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";

const methods = [
  {
    title: "Scan struk otomatis",
    description: "Foto nota atau struk, lalu tinjau rinciannya.",
    icon: ScanLine,
    tone: "scan",
    status: "Kamera & galeri",
  },
  {
    title: "Voice note kilat",
    description: "Ceritakan pengeluaranmu lewat suara.",
    icon: Mic,
    tone: "voice",
    status: "Segera hadir",
  },
  {
    title: "Input manual lengkap",
    description: "Isi nominal, kategori, dan catatan sendiri.",
    icon: NotebookPen,
    tone: "manual",
    status: "Pratinjau",
  },
];

export function QuickAddMethods({
  onClose,
  onChoose,
}: {
  onClose: () => void;
  onChoose: (title: string) => void;
}) {
  return (
    <>
      <div className="speed-pods">
        {methods.map(({ title, description, icon: Icon, tone, status }) => (
          <button
            key={tone}
            data-modal-focus-key={`method:${title}`}
            className={`speed-pod speed-pod-${tone}`}
            onClick={() => onChoose(title)}
          >
            <span className="speed-pod-icon">
              <Icon size={27} strokeWidth={1.8} />
            </span>
            <span className="speed-pod-copy">
              <strong>{title}</strong>
              <span className="method-status">{status}</span>
              <small>{description}</small>
            </span>
            <span className="speed-pod-arrow">
              <ArrowRight size={19} />
            </span>
          </button>
        ))}
      </div>
      <div className="quick-add-note">
        <Image
          src="/mascot/mochi-crown-transparent.webp"
          alt=""
          width={40}
          height={40}
        />
        <p>
          <strong>Catat dengan cara yang nyaman.</strong>
          <br />
          Satu hari dihitung satu check-in.
        </p>
      </div>
      <p className="quick-add-demo">
        Prototipe · Belum ada data yang disimpan.
      </p>
      <Button variant="ghost" className="quick-add-cancel" onClick={onClose}>
        Batal
      </Button>
    </>
  );
}
