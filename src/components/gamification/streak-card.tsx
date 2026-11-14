import { Flame, Shield, Check } from "lucide-react";

export function StreakCard({
  streak,
  freezeBalance,
  calendar,
}: {
  streak: number;
  freezeBalance: number;
  calendar: { date: string; day: string; status: string }[];
}) {
  return (
    <section className="card streak-card" aria-labelledby="streak-title">
      <div className="section-heading">
        <h2 id="streak-title">
          {streak} hari streak{" "}
          <Flame size={21} className="streak-flame" aria-hidden="true" />
        </h2>
        <span className="pill">
          <Shield size={14} />
          {freezeBalance} Freeze tersedia
        </span>
      </div>
      <ol className="streak-calendar">
        {calendar.map((day) => (
          <li
            key={day.date}
            aria-label={`${day.date}: ${day.status === "today" ? "check-in hari ini selesai" : "check-in aktif"}`}
          >
            <span>{day.day}</span>
            <span
              className={`day-marker ${day.status === "today" ? "today" : ""}`}
            >
              {day.status === "today" ? (
                <Check size={19} />
              ) : (
                <Flame size={16} />
              )}
            </span>
          </li>
        ))}
      </ol>
      <p className="caption streak-note">
        <Check size={14} />
        Kamu sudah check-in. Sampai jumpa besok!
      </p>
    </section>
  );
}
