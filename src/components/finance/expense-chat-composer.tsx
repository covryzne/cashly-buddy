"use client";

import { useId, useRef, useState } from "react";
import { ArrowUp, Plus, Sparkles } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

export const expenseExamples = [
  "Nescafe coffee 12k",
  "Makan siang 25rb",
  "Ojek 18k",
];

export function ExpenseChatComposer({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const examplesId = useId();
  return (
    <div className="expense-chat-composer">
      {examplesOpen && (
        <div
          id={examplesId}
          className="chat-examples"
          aria-label="Contoh catatan"
        >
          {expenseExamples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                onChange(example);
                setExamplesOpen(false);
                textarea.current?.focus({ preventScroll: true });
              }}
            >
              {example}
            </button>
          ))}
        </div>
      )}
      <form
        ref={form}
        onSubmit={(event) => {
          event.preventDefault();
          if (value.trim()) onSend();
        }}
      >
        <InputGroup className="chat-input-group" aria-label="Tulis pengeluaran">
          <InputGroupTextarea
            ref={textarea}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.nativeEvent.keyCode !== 229
              ) {
                event.preventDefault();
                form.current?.requestSubmit();
              }
            }}
            aria-label="Catatan pengeluaran"
            placeholder="Habis beli Nescafe coffee 12k…"
            className="p-3"
            rows={2}
            maxLength={1000}
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton
              size="icon-sm"
              variant="outline"
              className="rounded-full chat-example-trigger"
              aria-label="Lihat contoh catatan"
              aria-expanded={examplesOpen}
              aria-controls={examplesOpen ? examplesId : undefined}
              onClick={() => setExamplesOpen(!examplesOpen)}
            >
              <Plus size={19} />
            </InputGroupButton>
            <span className="chat-composer-hint">
              <Sparkles size={13} /> Biar Mochi rapikan
            </span>
            <InputGroupButton
              type="submit"
              size="icon-sm"
              variant="default"
              className="rounded-full chat-send"
              aria-label="Kirim catatan"
              disabled={!value.trim()}
            >
              <ArrowUp size={20} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
      <p className="chat-keyboard-hint">
        Enter untuk kirim · Shift + Enter untuk baris baru
      </p>
    </div>
  );
}
