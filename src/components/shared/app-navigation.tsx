import Link from "next/link";
import {
  Home,
  ReceiptText,
  ChartNoAxesColumn,
  CircleUserRound,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { label: "Beranda", icon: Home },
  { label: "Aktivitas", icon: ReceiptText },
  { label: "Laporan", icon: ChartNoAxesColumn },
  { label: "Profil", icon: CircleUserRound },
];
export function AppNavigation({
  onAdd,
  onUpcoming,
}: {
  onAdd: () => void;
  onUpcoming: (label: string) => void;
}) {
  return (
    <>
      <aside className="sidebar">
        <p className="sidebar-menu-label">Menu utama</p>
        <p className="sidebar-tagline">Your little money adventure.</p>
        <nav aria-label="Navigasi desktop">
          {items.map(({ label, icon: Icon }, i) =>
            i === 0 ? (
              <Link
                key={label}
                className="nav-item selected"
                href="/beranda"
                aria-current="page"
              >
                <Icon size={21} />
                {label}
              </Link>
            ) : (
              <button
                key={label}
                className="nav-item"
                onClick={() => onUpcoming(label)}
              >
                <Icon size={21} />
                {label}
                <span className="nav-soon">Nanti</span>
              </button>
            ),
          )}
        </nav>
        <Button onClick={onAdd}>
          <Plus size={20} />
          Catat pengeluaran
        </Button>
        <div className="sidebar-footer">
          <p>
            Langkah kecil hari ini,
            <br />
            kebiasaan baik esok hari.
          </p>
        </div>
      </aside>
      <nav className="bottom-nav" aria-label="Navigasi utama">
        {items.slice(0, 2).map(({ label, icon: Icon }, i) =>
          i === 0 ? (
            <Link
              href="/beranda"
              key={label}
              aria-current="page"
              className="bottom-item selected"
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          ) : (
            <button
              key={label}
              className="bottom-item"
              onClick={() => onUpcoming(label)}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ),
        )}
        <button
          className="quick-add"
          aria-label="Catat pengeluaran"
          onClick={onAdd}
        >
          <Plus size={29} />
        </button>
        {items.slice(2).map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="bottom-item"
            onClick={() => onUpcoming(label)}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
