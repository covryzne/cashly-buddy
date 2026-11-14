"use client";

import { useState, useSyncExternalStore } from "react";
import { Sparkles, Zap, Hand, ArrowUpRight, WifiOff } from "lucide-react";
import {
  homeFixture as data,
  type Category,
  type Expense,
} from "@/mocks/fixtures/home";
import { formatDate } from "@/lib/format/datetime";
import { MoneyDisplay } from "@/components/finance/money-display";
import { CategoryIcon } from "@/components/finance/category-icon";
import { TransactionRow } from "@/components/finance/transaction-row";
import { ExpenseSummaryCard } from "@/components/finance/expense-summary-card";
import { StreakCard } from "@/components/gamification/streak-card";
import { MissionBoard } from "@/components/gamification/mission-board";
import { MissionCard } from "@/components/gamification/mission-card";
import { MascotStageRenderer } from "@/components/gamification/mascot-stage-renderer";
import { AppNavigation } from "@/components/shared/app-navigation";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { PeriodPicker } from "@/components/finance/period-picker";
import { QuickAddMethods } from "@/components/finance/quick-add-methods";
import { monthKey, selectPeriod, selectWeeklyStory } from "./select-month";
import type { PeriodSelection } from "@/lib/format/period";
import { useModalStack } from "@/components/shared/use-modal-stack";
import {
  ExpenseDetail,
  ExpenseDetailActions,
} from "@/components/finance/expense-detail";
import { WeeklyStory } from "@/components/finance/weekly-story";
import { FeaturePreview } from "@/components/shared/feature-preview";
import { Dialog } from "@/components/ui/dialog";
import { ScanReceiptFlow } from "@/features/scan/scan-receipt-flow";

const subscribeClock = (notify: () => void) => {
  window.addEventListener("focus", notify);
  return () => window.removeEventListener("focus", notify);
};

type Panel =
  | { kind: "add" }
  | { kind: "scan" }
  | { kind: "period" }
  | { kind: "upcoming"; label: string }
  | { kind: "category"; category: Category }
  | { kind: "expense"; expense: Expense }
  | { kind: "transactions" }
  | { kind: "missions" }
  | { kind: "weekly" };
const subscribeOnline = (notify: () => void) => {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
};
export function HomeDashboard() {
  const currentMonth = useSyncExternalStore(
    subscribeClock,
    () => monthKey(),
    () => monthKey(data.asOf),
  );
  const [periodOverride, setPeriodOverride] = useState<PeriodSelection | null>(
    null,
  );
  const selection: PeriodSelection = periodOverride ?? {
    kind: "month",
    month: currentMonth,
  };
  const snapshot = selectPeriod(selection);
  const weekly = selectWeeklyStory();
  const {
    panel,
    open: setPanel,
    push,
    back,
    close,
    canGoBack,
  } = useModalStack<Panel>();
  const [greeting, setGreeting] = useState(false);
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const upcoming = (label: string) => setPanel({ kind: "upcoming", label });
  const selectedExpenses =
    panel?.kind === "category"
      ? snapshot.expenses.filter(
          (expense) => expense.categoryCode === panel.category.code,
        )
      : snapshot.expenses;
  const panelTitle =
    panel?.kind === "add"
      ? "Catat pengeluaran baru"
      : panel?.kind === "weekly"
        ? "Cerita mingguan"
        : panel?.kind === "period"
          ? "Pilih periode pengeluaran"
          : panel?.kind === "upcoming"
            ? panel.label
            : panel?.kind === "category"
              ? panel.category.label
              : panel?.kind === "expense"
                ? "Detail pengeluaran"
                : panel?.kind === "missions"
                  ? "Misi kamu"
                  : "Transaksi periode ini";
  return (
    <>
      <a href="#main-content" className="skip-link">
        Langsung ke konten
      </a>
      <AppNavigation
        onAdd={() => setPanel({ kind: "add" })}
        onUpcoming={upcoming}
      />
      <div className="app-shell">
        <div className="home-theme-control">
          <ThemeToggle />
        </div>
        <main id="main-content" className="dashboard">
          {!online && (
            <p className="offline-banner" role="status">
              <WifiOff size={18} />
              Kamu sedang offline. Periksa koneksi internetmu.
            </p>
          )}
          <div className="greeting-row">
            <div>
              <p className="desktop-eyebrow">
                Sedikit perhatian, kebiasaan yang lebih baik.
              </p>
              <h1>
                Hi, {data.name}! <span aria-hidden="true">👋</span>
              </h1>
              <p className="muted greeting-date">
                {formatDate(data.asOf, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className="pill xp-pill">
              <Zap size={15} />
              Lvl {data.level} · {data.xp} XP
            </span>
          </div>
          <div className="home-grid">
            <div className="summary-area">
              <ExpenseSummaryCard
                onPeriod={() => setPanel({ kind: "period" })}
                isCurrentMonth={
                  selection.kind === "month" && selection.month === currentMonth
                }
                totalIdr={snapshot.totalIdr}
                period={snapshot.period}
                count={snapshot.count}
                onAdd={() => setPanel({ kind: "add" })}
              />
            </div>
            <section
              className="companion-area companion-card"
              aria-labelledby="companion-title"
            >
              <h2 id="companion-title" className="pill companion-title">
                Mochi & pengeluaranmu <Sparkles size={14} />
              </h2>
              <div className="mascot-stage">
                <div className="mascot-center">
                  <MascotStageRenderer
                    stage={data.mascotStage}
                    onGreeting={() => setGreeting(true)}
                  />
                  <span className="mascot-label">
                    <Sparkles size={13} />
                    Level {data.mascotStage}
                  </span>
                </div>
                {snapshot.categories.map((category, index) => (
                  <button
                    key={category.code}
                    className={`floating-category float-${index}`}
                    onClick={() => setPanel({ kind: "category", category })}
                  >
                    <CategoryIcon category={category} />
                    <span>
                      <small>{category.label}</small>
                      <MoneyDisplay amountIdr={category.amountIdr} />
                    </span>
                  </button>
                ))}
              </div>
              <p className="mascot-level-copy">
                Mochi kamu masih level {data.mascotStage} nih
              </p>
              <p className="companion-hint" aria-live="polite">
                {greeting ? (
                  "Hai, Nara! Senang menemanimu hari ini."
                ) : (
                  <>
                    <Hand size={14} />
                    Tap kartu untuk melihat rincian pengeluaran
                  </>
                )}
              </p>
              <p className="caption mascot-disclaimer">
                Bertumbuh lewat streak, bukan XP.
              </p>
            </section>
            <div className="streak-area">
              <StreakCard
                streak={data.streak}
                freezeBalance={data.freezeBalance}
                calendar={data.calendar}
              />
            </div>
            <section className="missions-area">
              <div className="section-heading section-title">
                <h2>
                  Misi hari ini <span className="count-badge">1/2</span>
                </h2>
                <button
                  className="text-button"
                  onClick={() => setPanel({ kind: "missions" })}
                >
                  Lihat semua <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="mission-list">
                <MissionCard
                  title="Catat pengeluaran hari ini"
                  completed
                  onSelect={() => setPanel({ kind: "missions" })}
                />
                <MissionCard
                  title="Review cerita mingguan"
                  completed={false}
                  onSelect={() => setPanel({ kind: "missions" })}
                />
              </div>
            </section>
            <section className="transactions-area">
              <div className="section-heading section-title">
                <h2>Transaksi terbaru</h2>
                <button
                  className="text-button"
                  onClick={() => setPanel({ kind: "transactions" })}
                >
                  Lihat semua <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="card transaction-list">
                {snapshot.expenses.length === 0 && (
                  <div className="empty-expenses">
                    <p>Belum ada pengeluaran di periode ini.</p>
                    <small>Pilih periode lain untuk melihat catatanmu.</small>
                  </div>
                )}
                {snapshot.expenses.slice(0, 3).map((expense) => (
                  <TransactionRow
                    key={expense.id}
                    expense={expense}
                    category={data.categories.find(
                      (category) => category.code === expense.categoryCode,
                    )!}
                    onSelect={() => setPanel({ kind: "expense", expense })}
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
      {panel?.kind === "scan" && (
        <ScanReceiptFlow onBack={back} onClose={close} />
      )}
      {panel && panel.kind !== "scan" && (
        <Dialog
          title={panelTitle}
          onClose={close}
          onBack={canGoBack ? back : undefined}
          variant={
            panel.kind === "add" || panel.kind === "expense"
              ? "sheet"
              : "default"
          }
          className={
            panel.kind === "expense" ? "expense-detail-dialog" : undefined
          }
          footer={
            panel.kind === "expense" ? (
              <ExpenseDetailActions onDone={close} />
            ) : undefined
          }
          description={
            panel.kind === "add"
              ? "Pilih cara input yang paling praktis untukmu"
              : undefined
          }
        >
          {panel.kind !== "add" && panel.kind !== "expense" && (
            <span className="pill dialog-demo">
              {panel.kind === "missions"
                ? data.period
                : panel.kind === "weekly"
                  ? weekly.period
                  : snapshot.period}
            </span>
          )}
          {panel.kind === "add" && (
            <QuickAddMethods
              onClose={close}
              onChoose={(label) =>
                push(
                  label === "Scan struk otomatis"
                    ? { kind: "scan" }
                    : { kind: "upcoming", label },
                )
              }
            />
          )}
          {panel.kind === "period" && (
            <PeriodPicker
              selection={selection}
              onApply={(value) => {
                setPeriodOverride(value);
                close();
              }}
            />
          )}
          {panel.kind === "upcoming" && <FeaturePreview label={panel.label} />}
          {(panel.kind === "category" || panel.kind === "transactions") && (
            <>
              {panel.kind === "category" && (
                <div className="category-total">
                  <span>Total {panel.category.label.toLowerCase()}</span>
                  <MoneyDisplay amountIdr={panel.category.amountIdr} />
                </div>
              )}
              <div className="transaction-list">
                {selectedExpenses.length === 0 && (
                  <p className="empty-expenses">
                    Belum ada transaksi pada periode ini.
                  </p>
                )}
                {selectedExpenses.map((expense) => (
                  <TransactionRow
                    key={expense.id}
                    expense={expense}
                    category={data.categories.find(
                      (category) => category.code === expense.categoryCode,
                    )!}
                    onSelect={() => push({ kind: "expense", expense })}
                  />
                ))}
              </div>
            </>
          )}

          {panel.kind === "expense" && (
            <ExpenseDetail
              expense={panel.expense}
              period={snapshot.period}
              category={data.categories.find(
                (category) => category.code === panel.expense.categoryCode,
              )!}
            />
          )}
          {panel.kind === "missions" && (
            <MissionBoard onOpenReview={() => push({ kind: "weekly" })} />
          )}
          {panel.kind === "weekly" && (
            <WeeklyStory
              totalIdr={weekly.totalIdr}
              count={weekly.count}
              categories={weekly.categories}
            />
          )}
        </Dialog>
      )}
    </>
  );
}
