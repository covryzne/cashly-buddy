import { Slide } from "loading-dev";
import type { ComponentProps } from "react";

type AssetLoaderProps = ComponentProps<typeof Slide> & { label?: string };

export function AssetLoader({
  size = 48,
  label,
  className = "",
  ...props
}: AssetLoaderProps) {
  return (
    <div
      className={`asset-loader ${className}`}
      role={label ? "status" : undefined}
      aria-label={label}
    >
      <Slide size={size} {...props} />
    </div>
  );
}
