import type { ComponentProps } from "react";

export function Button({
  className = "",
  variant = "primary",
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "default" | "secondary" | "ghost" | "outline";
  size?:
    "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
}) {
  return (
    <button
      type={type}
      data-slot="button"
      data-size={size}
      className={`button button-${variant === "default" ? "primary" : variant} ${className}`}
      {...props}
    />
  );
}
