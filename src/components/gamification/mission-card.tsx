import { Check, BookOpen } from "lucide-react";

export function MissionCard({
  title,
  completed,
  onSelect,
}: {
  title: string;
  completed: boolean;
  onSelect: () => void;
}) {
  return (
    <button className="card mission-card" onClick={onSelect}>
      <span
        className={`mission-icon ${completed ? "tone-mint" : "tone-butter"}`}
      >
        {completed ? <Check size={20} /> : <BookOpen size={20} />}
      </span>
      <span className="mission-copy">
        <strong>{title}</strong>
        <small className={completed ? "success" : ""}>
          {completed ? "Selesai · 1/1" : "Belum direview · 0/1"}
        </small>
      </span>
      <span className="pill">{completed ? "Selesai" : "Mingguan"}</span>
    </button>
  );
}
