import type { ComponentProps } from "react";

// Presentational field primitives for the shadcn DatePickerTime composition.
export function Field({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="field" className={`cashly-field ${className}`} {...props} />
  );
}
export function FieldGroup({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={`cashly-field-group ${className}`}
      {...props}
    />
  );
}
export function FieldLabel({
  className = "",
  ...props
}: ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={`cashly-field-label ${className}`}
      {...props}
    />
  );
}
