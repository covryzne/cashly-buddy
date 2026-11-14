import { Utensils, TrainFront, Zap, Gamepad2 } from "lucide-react";
import type { Category } from "@/mocks/fixtures/home";

const icons = {
  food: Utensils,
  transport: TrainFront,
  bills: Zap,
  entertainment: Gamepad2,
};
export function CategoryIcon({ category }: { category: Category }) {
  const Icon = icons[category.icon];
  return (
    <span className={`category-icon tone-${category.tone}`}>
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}
