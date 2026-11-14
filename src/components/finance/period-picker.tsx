"use client";
import { useState } from "react";
import DatePicker from "react-datepicker";
import { id } from "date-fns/locale/id";
import { CalendarDays, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format/datetime";
import {
  calendarDate,
  calendarDateKey,
  rangeLabel,
  type PeriodSelection,
} from "@/lib/format/period";
import "react-datepicker/dist/react-datepicker.css";

const years = Array.from({ length: 100 }, (_, index) => 2000 + index);
const months = Array.from({ length: 12 }, (_, index) =>
  formatDate(`2026-${String(index + 1).padStart(2, "0")}-01T12:00:00+07:00`, {
    month: "long",
  }),
);
export function PeriodPicker({
  selection,
  onApply,
}: {
  selection: PeriodSelection;
  onApply: (selection: PeriodSelection | null) => void;
}) {
  const [mode, setMode] = useState(selection.kind);
  const [draftMonth, setDraftMonth] = useState(
    selection.kind === "month" ? selection.month : selection.start.slice(0, 7),
  );
  const [range, setRange] = useState<[Date | null, Date | null]>(
    selection.kind === "range"
      ? [calendarDate(selection.start), calendarDate(selection.end)]
      : [null, null],
  );
  const [start, end] = range;
  const complete = mode === "month" || Boolean(start && end);
  return (
    <form
      className="period-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (mode === "month") onApply({ kind: "month", month: draftMonth });
        else if (start && end)
          onApply({
            kind: "range",
            start: calendarDateKey(start),
            end: calendarDateKey(end),
          });
      }}
    >
      <div className="period-modes" role="group" aria-label="Jenis periode">
        {(["month", "range"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {mode === value && <Check size={14} />}
            {value === "month" ? "Bulan" : "Rentang tanggal"}
          </button>
        ))}
      </div>
      <div className="period-selection" aria-live="polite">
        <span className="period-selection-icon">
          <CalendarDays size={21} />
        </span>
        <span>
          <small>Periode pilihanmu · WIB</small>
          <strong>
            {mode === "month"
              ? formatDate(`${draftMonth}-01T12:00:00+07:00`, {
                  month: "long",
                  year: "numeric",
                })
              : start && end
                ? rangeLabel(calendarDateKey(start), calendarDateKey(end))
                : start
                  ? "Pilih tanggal akhir"
                  : "Pilih tanggal mulai"}
          </strong>
        </span>
      </div>
      {mode === "range" && (
        <div className="range-endpoints">
          {range.map((value, index) => (
            <div key={index}>
              <small>{index === 0 ? "Mulai" : "Sampai"}</small>
              <strong>
                {value
                  ? rangeLabel(calendarDateKey(value), calendarDateKey(value))
                  : "Belum dipilih"}
              </strong>
            </div>
          ))}
        </div>
      )}
      {mode === "month" ? (
        <DatePicker
          inline
          selected={calendarDate(`${draftMonth}-01`)}
          onChange={(date: Date | null) => {
            if (date) setDraftMonth(calendarDateKey(date).slice(0, 7));
          }}
          locale={id}
          showMonthYearPicker
          showFourColumnMonthYearPicker
          calendarClassName="cashly-calendar"
          monthAriaLabelPrefix="Pilih bulan"
          minDate={new Date(2000, 0, 1)}
          maxDate={new Date(2099, 11, 31)}
          renderCustomHeader={({
            date,
            changeYear,
            decreaseYear,
            increaseYear,
          }) => (
            <div className="calendar-year-nav">
              <button
                type="button"
                className="icon-button"
                aria-label="Tahun sebelumnya"
                disabled={date.getFullYear() <= 2000}
                onClick={decreaseYear}
              >
                <ChevronLeft size={19} />
              </button>
              <select
                aria-label="Tahun pengeluaran"
                value={date.getFullYear()}
                onChange={(event) => changeYear(Number(event.target.value))}
              >
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button"
                aria-label="Tahun berikutnya"
                disabled={date.getFullYear() >= 2099}
                onClick={increaseYear}
              >
                <ChevronRight size={19} />
              </button>
            </div>
          )}
        />
      ) : (
        <DatePicker
          inline
          selectsRange
          allowSameDay
          swapRange
          startDate={start}
          endDate={end}
          selected={start}
          openToDate={start ?? calendarDate(`${draftMonth}-01`)}
          onChange={(dates: [Date | null, Date | null]) => setRange(dates)}
          locale={id}
          calendarClassName="cashly-calendar cashly-range-calendar"
          minDate={new Date(2000, 0, 1)}
          maxDate={new Date(2099, 11, 31)}
          renderCustomHeader={({
            date,
            changeMonth,
            changeYear,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="calendar-year-nav calendar-month-nav">
              <button
                type="button"
                className="icon-button"
                aria-label="Bulan sebelumnya"
                disabled={prevMonthButtonDisabled}
                onClick={decreaseMonth}
              >
                <ChevronLeft size={19} />
              </button>
              <select
                aria-label="Bulan rentang"
                value={date.getMonth()}
                onChange={(event) => changeMonth(Number(event.target.value))}
              >
                {months.map((label, value) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Tahun rentang"
                value={date.getFullYear()}
                onChange={(event) => changeYear(Number(event.target.value))}
              >
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button"
                aria-label="Bulan berikutnya"
                disabled={nextMonthButtonDisabled}
                onClick={increaseMonth}
              >
                <ChevronRight size={19} />
              </button>
            </div>
          )}
        />
      )}
      {mode === "range" && (
        <p className="calendar-help muted">
          Pilih tanggal mulai dan akhir. Untuk satu hari, pilih tanggal yang
          sama dua kali.
        </p>
      )}
      <div className="period-actions">
        <Button type="submit" disabled={!complete}>
          Terapkan periode
        </Button>
        <Button variant="ghost" onClick={() => onApply(null)}>
          Kembali ke bulan ini
        </Button>
      </div>
    </form>
  );
}
