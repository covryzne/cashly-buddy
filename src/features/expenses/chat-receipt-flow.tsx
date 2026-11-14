"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { MessageCircle, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import {
  ExpenseChatComposer,
  expenseExamples,
} from "@/components/finance/expense-chat-composer";
import {
  ReceiptAnalysis,
  RECEIPT_ANALYSIS_DURATION_MS,
} from "@/components/finance/receipt-analysis";
import { ReceiptReview } from "@/components/finance/receipt-review";
import { ReceiptScanSuccess } from "@/components/finance/receipt-scan-success";
import { MoneyDisplay } from "@/components/finance/money-display";
import {
  blankReceipt,
  receiptAmounts,
  receiptSchema,
  type ReceiptDraft,
} from "@/features/scan/receipt-schema";
import { parseExpenseText, type ExpenseTextResult } from "./parse-expense-text";

type Step = "chat" | "processing" | "review" | "success" | "transcript";
type ChatMessage = { id: number; role: "user" | "assistant"; text: string };

export function ChatReceiptFlow({
  onBack,
  onClose,
  initialText = "",
  source = "chat",
  onEditSource,
  onStartOver,
  initialDraft,
  onSourceChange,
}: {
  onBack: () => void;
  onClose: () => void;
  initialText?: string;
  source?: "chat" | "voice";
  onEditSource?: () => void;
  onStartOver?: () => void;
  initialDraft?: ReceiptDraft;
  onSourceChange?: (text: string) => void;
}) {
  const [step, setStep] = useState<Step>(
    initialDraft ? "review" : initialText ? "processing" : "chat",
  );
  const [input, setInput] = useState("");
  const [sourceText, setSourceText] = useState(initialText);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hai! Ceritakan pengeluaranmu. Cukup nama pembelian dan nominalnya, ya.",
    },
  ]);
  const sequence = useRef(0);
  const [draft, setDraft] = useState<ReceiptDraft>(
    () => initialDraft ?? blankReceipt(),
  );
  const [transcriptError, setTranscriptError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<ReceiptDraft | null>(null);
  const [missing, setMissing] = useState<{
    text: string;
    reason: "name" | "amount";
  } | null>(null);
  const pending = useRef<{ text: string; result: ExpenseTextResult } | null>(
    initialText
      ? { text: initialText, result: parseExpenseText(initialText) }
      : null,
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const formId = useId();
  const total = receiptAmounts(draft).total;

  function addMessage(role: ChatMessage["role"], text: string) {
    const message = { id: ++sequence.current, role, text };
    setMessages((previous) => [...previous, message]);
  }

  useEffect(() => {
    if (step !== "processing") return;
    const work = pending.current;
    const timer = window.setTimeout(() => {
      if (!work || pending.current !== work) return;
      pending.current = null;
      if (work.result.kind === "ready") {
        setDraft(work.result.draft);
        setErrors({});
        setMissing(null);
        setMessages((previous) => [
          ...previous,
          {
            id: ++sequence.current,
            role: "assistant",
            text: "Rinciannya sudah siap. Cek kembali sebelum disimpan, ya.",
          },
        ]);
        setStep("review");
      } else {
        const result = work.result;
        setMissing(
          result.reason === "ambiguous"
            ? null
            : { text: work.text, reason: result.reason },
        );
        setMessages((previous) => [
          ...previous,
          { id: ++sequence.current, role: "assistant", text: result.message },
        ]);
        setStep("chat");
      }
    }, RECEIPT_ANALYSIS_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current?.closest("dialog");
      if (!dialog) return;
      dialog.scrollTop = 0;
      if (step === "chat") {
        const content = dialog.querySelector(".dialog-content");
        if (content) content.scrollTop = content.scrollHeight;
      } else
        dialog
          .querySelector<HTMLElement>('[aria-label="Kembali"]')
          ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [step, messages.length]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const dialog = dialogRef.current?.closest<HTMLElement>("dialog");
    if ((step !== "chat" && step !== "transcript") || !viewport || !dialog)
      return;
    const resize = () =>
      dialog.style.setProperty(
        "--chat-viewport-height",
        `${viewport.height}px`,
      );
    resize();
    viewport.addEventListener("resize", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      dialog.style.removeProperty("--chat-viewport-height");
    };
  }, [step]);

  function send() {
    if (pending.current || step !== "chat" || !input.trim()) return;
    let text = input.trim();
    let result = parseExpenseText(text);
    if (missing && result.kind === "clarify" && result.reason !== "ambiguous") {
      const combined =
        missing.reason === "amount"
          ? `${missing.text} ${text}`
          : `${text} ${missing.text}`;
      const combinedResult = parseExpenseText(combined);
      if (combinedResult.kind === "ready") {
        text = combined;
        result = combinedResult;
      }
    }
    addMessage("user", input.trim());
    setInput("");
    setSourceText(text);
    setMissing(null);
    pending.current = { text, result };
    setStep("processing");
  }
  function returnToChat() {
    pending.current = null;
    if (onEditSource) {
      onEditSource();
      return;
    }
    setInput(sourceText);
    setStep("chat");
  }
  function back() {
    if (step === "chat") onBack();
    else if (step === "success" || step === "transcript") setStep("review");
    else returnToChat();
  }
  function applyTranscript() {
    const text = input.trim();
    const result = parseExpenseText(text);
    if (result.kind === "clarify") {
      setTranscriptError(result.message);
      return;
    }
    setTranscriptError("");
    setSourceText(text);
    onSourceChange?.(text);
    pending.current = { text, result };
    setStep("processing");
  }
  function submit() {
    const result = receiptSchema.safeParse(draft);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues)
        next[issue.path.join(".")] ??= issue.message;
      setErrors(next);
      requestAnimationFrame(() =>
        document.getElementById(`scan-${Object.keys(next)[0]}`)?.focus(),
      );
      return;
    }
    setConfirmed(result.data);
    setErrors({});
    setStep("success");
  }

  return (
    <Dialog
      title={
        {
          chat: "Chat manual",
          processing:
            source === "voice" ? "Analisis voice note" : "Analisis catatan",
          review: "Review pengeluaran",
          success: "Konfirmasi pengeluaran",
          transcript: "Ubah transkrip",
        }[step]
      }
      variant="screen"
      className={`scan-flow ${step === "chat" || step === "transcript" ? "expense-chat-flow" : `scan-flow-${step}`}`}
      onBack={back}
      onClose={onClose}
      footer={
        step === "chat" ? (
          <ExpenseChatComposer
            value={input}
            onChange={setInput}
            onSend={send}
          />
        ) : step === "transcript" ? (
          <div className="scan-review-actions">
            <Button type="submit" form={formId}>
              Terapkan transkrip
            </Button>
          </div>
        ) : step === "processing" ? (
          <div className="analysis-actions">
            <div>
              <Button variant="secondary" onClick={returnToChat}>
                {source === "voice" ? "Kembali ke rekaman" : "Kembali ke chat"}
              </Button>
              <Button variant="secondary" onClick={returnToChat}>
                Batal
              </Button>
            </div>
          </div>
        ) : step === "review" ? (
          <div className="scan-review-actions">
            <Button type="submit" form={formId}>
              <ShieldCheck size={18} /> Simpan pengeluaran{" "}
              <MoneyDisplay
                amountIdr={(total > BigInt(0) ? total : BigInt(0)).toString()}
              />
            </Button>
          </div>
        ) : (
          <div className="scan-success-actions">
            <Button onClick={onClose}>Kembali ke Beranda</Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (onStartOver || onEditSource) {
                  (onStartOver ?? onEditSource)?.();
                  return;
                }
                setInput("");
                setSourceText("");
                setMessages([
                  {
                    id: ++sequence.current,
                    role: "assistant",
                    text: "Yuk, ceritakan pengeluaran berikutnya.",
                  },
                ]);
                setMissing(null);
                setConfirmed(null);
                setStep("chat");
              }}
            >
              {source === "voice" ? (
                <Mic size={17} />
              ) : (
                <MessageCircle size={17} />
              )}{" "}
              Catat lagi
            </Button>
          </div>
        )
      }
    >
      <div ref={dialogRef} className="chat-flow-content">
        {step === "transcript" && (
          <form
            id={formId}
            className="voice-source-editor"
            onSubmit={(event) => {
              event.preventDefault();
              applyTranscript();
            }}
          >
            <label htmlFor="voice-source-text">Transkrip voice note</label>
            <p>
              Periksa nama pembelian dan nominalnya sebelum diterapkan ke
              rincian.
            </p>
            <Textarea
              id="voice-source-text"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setTranscriptError("");
              }}
              maxLength={1000}
              rows={5}
              placeholder="Contoh: habis beli Nescafe coffee 12k"
              aria-invalid={!!transcriptError}
              aria-describedby={
                transcriptError ? "voice-source-error" : undefined
              }
            />
            {transcriptError && (
              <p
                id="voice-source-error"
                className="scan-field-error"
                role="alert"
              >
                {transcriptError}
              </p>
            )}
          </form>
        )}
        {step === "chat" && (
          <>
            {messages.length === 1 && (
              <section
                className="chat-welcome"
                aria-labelledby="chat-welcome-title"
              >
                <div className="chat-mochi">
                  <Image
                    src="/mascot/mochi-crown-transparent.webp"
                    alt="Mochi menemani catatanmu"
                    width={88}
                    height={88}
                  />
                  <Sparkles size={20} />
                </div>
                <span className="pill">Cerita kecil, jadi catatan.</span>
                <h3 id="chat-welcome-title">Belanja apa hari ini?</h3>
                <p>Ceritakan sekali. Mochi bantu rapikan rinciannya.</p>
                <div className="chat-examples">
                  {expenseExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setInput(example);
                        dialogRef.current
                          ?.closest("dialog")
                          ?.querySelector<HTMLTextAreaElement>("textarea")
                          ?.focus({ preventScroll: true });
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <div
              className="expense-chat-messages"
              role="log"
              aria-label="Percakapan pengeluaran"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {messages.map((message) => (
                <Message
                  key={message.id}
                  align={message.role === "user" ? "end" : "start"}
                  className={`expense-message expense-message-${message.role}`}
                >
                  {message.role === "assistant" && (
                    <MessageAvatar>
                      <Image
                        src="/mascot/mochi-crown-transparent.webp"
                        alt=""
                        width={30}
                        height={30}
                      />
                    </MessageAvatar>
                  )}
                  <MessageContent>
                    <span className="chat-speaker">
                      {message.role === "user" ? "Kamu" : "Mochi"}
                    </span>
                    <Bubble
                      align={message.role === "user" ? "end" : "start"}
                      variant={message.role === "user" ? "default" : "muted"}
                    >
                      <BubbleContent>{message.text}</BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              ))}
            </div>
          </>
        )}
        {step === "processing" && (
          <ReceiptAnalysis example={false} source={source} />
        )}
        {step === "review" && (
          <ReceiptReview
            draft={draft}
            text={sourceText}
            textSource={source}
            errors={errors}
            formId={formId}
            onChange={(next) => {
              setDraft(next);
              setErrors({});
            }}
            onSubmit={submit}
            onRetake={
              source === "voice"
                ? () => {
                    setInput(sourceText);
                    setTranscriptError("");
                    setStep("transcript");
                  }
                : returnToChat
            }
          />
        )}
        {step === "success" && confirmed && (
          <ReceiptScanSuccess draft={confirmed} />
        )}
      </div>
    </Dialog>
  );
}
