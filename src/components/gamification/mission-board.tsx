import {
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Flame,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function MissionBoard({ onOpenReview }: { onOpenReview: () => void }) {
  return (
    <div className="mission-board">
      <div className="mission-board-summary">
        <span className="mission-summary-icon">
          <CheckCheck size={25} />
        </span>
        <div>
          <strong>Satu langkah baik hari ini.</strong>
          <p>1 dari 2 misi selesai</p>
        </div>
        <span className="mission-summary-count">1/2</span>
      </div>
      <progress
        className="mission-board-progress"
        value={1}
        max={2}
        aria-label="Progres misi"
      />
      <ul className="mission-detail-list">
        <li className="mission-detail mission-detail-done">
          <div className="mission-detail-heading">
            <span className="mission-detail-icon tone-mint">
              <Check size={21} />
            </span>
            <div>
              <small>Harian</small>
              <h3>Catat pengeluaran hari ini</h3>
            </div>
            <span className="mission-status-done">
              <Check size={13} />
              Selesai
            </span>
          </div>
          <p>
            Pengeluaranmu sudah tercatat di data demo. Check-in hari ini juga
            sudah selesai.
          </p>
          <div className="mission-detail-foot">
            <Flame size={14} />
            <span>Check-in harian</span>
            <strong>1/1</strong>
          </div>
        </li>
        <li className="mission-detail">
          <div className="mission-detail-heading">
            <span className="mission-detail-icon tone-butter">
              <BookOpen size={21} />
            </span>
            <div>
              <small>Mingguan</small>
              <h3>Review cerita mingguan</h3>
            </div>
          </div>
          <p>
            Luangkan waktu sebentar untuk mengenali pola pengeluaranmu minggu
            ini.
          </p>
          <div className="mission-detail-foot">
            <span className="mission-pending-dot" />
            <span>Belum direview</span>
            <strong>0/1</strong>
          </div>
          <Button
            variant="secondary"
            data-modal-focus-key="weekly-story"
            onClick={onOpenReview}
          >
            Lihat cerita mingguan
            <ChevronRight size={17} />
          </Button>
        </li>
      </ul>
      <div className="mission-board-note">
        <ShieldCheck size={18} />
        <p>
          Check-in dihitung sekali sehari. Membuka misi atau menyapa Mochi tidak
          menambah XP.
        </p>
      </div>
    </div>
  );
}
