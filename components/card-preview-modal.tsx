"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SimpleMarkdown } from "@/components/simple-markdown";

type PreviewCard = {
  title: string;
  display_mode: "center" | "content";
  center_text: string | null;
  content_markdown: string;
};

type CardPreviewModalProps = {
  title?: string;
  card: PreviewCard;
  onClose: () => void;
};

export function CardPreviewModal({
  title = "卡片預覽",
  card,
  onClose,
}: CardPreviewModalProps) {
  const isCenter = card.display_mode === "center";
  const centerText = card.center_text || card.title;

  return (
    <div className="fixed inset-0 z-50 hidden items-center justify-center px-6 md:flex">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/35 backdrop-blur-sm"
        aria-label="關閉卡片預覽"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col rounded-4xl bg-card/95 p-6 shadow-[0_40px_140px_-60px_rgba(20,20,20,0.5)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground md:text-[2rem]">{card.title}</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-6 flex-1 overflow-y-auto p-0">
          {isCenter ? (
            <div className="flex min-h-72 items-center justify-center px-6 py-10 text-foreground">
              <p className="text-center text-[clamp(2.25rem,5vw,4.75rem)] font-semibold tracking-[0.24em] md:tracking-[0.3em]">
                {centerText}
              </p>
            </div>
          ) : (
            <div className="pr-1">
              <SimpleMarkdown content={card.content_markdown} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
