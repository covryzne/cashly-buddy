"use client";
import { useEffect, useRef, type ComponentProps } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { id } from "react-day-picker/locale";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { calendarDateKey } from "@/lib/format/period";

function CalendarDayButton({ day, modifiers, ...buttonProps }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // The popup can still be positioning inside an animated native dialog.
    // Keep DayPicker's keyboard focus without scrolling that dialog to the day.
    if (modifiers.focused) ref.current?.focus({ preventScroll: true });
  }, [modifiers.focused]);
  return (
    <button
      type="button"
      {...buttonProps}
      ref={ref}
      data-day={calendarDateKey(day.date)}
    />
  );
}

// shadcn Calendar pattern, adapted to existing Cashly button/theme styles.
// https://ui.shadcn.com/docs/components/base/calendar
export function Calendar({
  className,
  components,
  locale = id,
  ...props
}: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={locale}
      showOutsideDays
      captionLayout="dropdown"
      startMonth={new Date(2000, 0)}
      endMonth={new Date(2099, 11)}
      className={["cashly-calendar-ui", className].filter(Boolean).join(" ")}
      components={{
        DayButton: CalendarDayButton,
        Chevron: ({ orientation, className }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : ChevronDown;
          return <Icon className={className} size={16} aria-hidden="true" />;
        },
        ...components,
      }}
      {...props}
    />
  );
}
