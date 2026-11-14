"use client";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

// Adapted from shadcn/ui's MIT Base UI composition, using Cashly tokens.
// https://ui.shadcn.com/docs/components/base/popover
export function Popover(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root {...props} />;
}
export function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}
export function PopoverContent({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 6,
  container,
  collisionBoundary,
  collisionPadding = 12,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "side" | "sideOffset" | "collisionBoundary" | "collisionPadding"
  > & {
    container?: PopoverPrimitive.Portal.Props["container"];
  }) {
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Positioner
        className="cashly-popover-positioner"
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={(state) =>
            [
              "cashly-popover-content",
              typeof className === "function" ? className(state) : className,
            ]
              .filter(Boolean)
              .join(" ")
          }
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}
