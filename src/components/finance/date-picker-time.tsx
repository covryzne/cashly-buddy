"use client";
import { useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/format/datetime";
import { calendarDate, calendarDateKey } from "@/lib/format/period";

export function DatePickerTime({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateId,
  timeId,
  dateName = "occurredDate",
  timeName = "occurredTime",
  dateError,
  timeError,
}: {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  dateId?: string;
  timeId?: string;
  dateName?: string;
  timeName?: string;
  dateError?: string;
  timeError?: string;
}) {
  const instanceId = useId();
  const dateControlId = dateId ?? `${instanceId}-date`;
  const timeControlId = timeId ?? `${instanceId}-time`;
  const [open, setOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<
    HTMLElement | undefined
  >();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? calendarDate(date)
    : undefined;
  const selected =
    parsedDate && calendarDateKey(parsedDate) === date ? parsedDate : undefined;
  const label = selected
    ? formatDate(`${date}T12:00:00+07:00`, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Pilih tanggal";
  return (
    <FieldGroup
      className="date-time-picker"
      role="group"
      aria-label="Tanggal dan waktu pengeluaran"
    >
      <Field>
        <FieldLabel htmlFor={dateControlId}>Tanggal pengeluaran</FieldLabel>
        <input type="hidden" name={dateName} value={date} />
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen)
              setPortalContainer(
                triggerRef.current?.closest("dialog") ?? undefined,
              );
            setOpen(nextOpen);
          }}
        >
          <PopoverTrigger
            render={
              <Button
                ref={triggerRef}
                type="button"
                variant="outline"
                id={dateControlId}
                className="date-time-trigger"
                aria-invalid={Boolean(dateError)}
                aria-describedby={
                  dateError ? `${dateControlId}-error` : undefined
                }
              >
                <span>{label}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </Button>
            }
          />
          <PopoverContent
            className="date-time-popover"
            container={portalContainer}
            collisionBoundary={portalContainer}
            aria-label="Pilih tanggal pengeluaran"
            initialFocus={false}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
              }
            }}
          >
            <Calendar
              mode="single"
              required
              selected={selected}
              defaultMonth={selected}
              autoFocus
              onSelect={(nextDate) => {
                onDateChange(calendarDateKey(nextDate));
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        {dateError && (
          <small id={`${dateControlId}-error`} className="scan-field-error">
            {dateError}
          </small>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor={timeControlId}>Waktu (WIB)</FieldLabel>
        <Input
          type="time"
          id={timeControlId}
          name={timeName}
          value={time}
          step={1}
          lang="id"
          className="date-time-input"
          aria-invalid={Boolean(timeError)}
          aria-describedby={timeError ? `${timeControlId}-error` : undefined}
          onChange={(event) => onTimeChange(event.target.value)}
        />
        {timeError && (
          <small id={`${timeControlId}-error`} className="scan-field-error">
            {timeError}
          </small>
        )}
      </Field>
    </FieldGroup>
  );
}
