"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EventCard, getParticipantEvent } from "@/lib/eventCreatorApi";
import { SimpleMarkdown } from "@/components/simple-markdown";

type CardPageClientProps = {
  eventSlug: string;
  cardId: string;
};

export function CardPageClient({ eventSlug, cardId }: CardPageClientProps) {
  const router = useRouter();
  const [card, setCard] = useState<EventCard | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCard() {
      setLoading(true);
      const result = await getParticipantEvent(eventSlug);

      if (cancelled) {
        return;
      }

      if (result.status === 401) {
        router.replace(`/login?redirect_to=${encodeURIComponent(`/events/${eventSlug}/cards/${cardId}`)}`);
        return;
      }

      const foundCard = result.data?.event.cards.find((item) => item.id === cardId) ?? null;
      if (!result.data || !foundCard) {
        setError(result.error || "找不到卡片");
        setLoading(false);
        return;
      }

      setEventTitle(result.data.event.title);
      setCard(foundCard);
      setError(null);
      setLoading(false);
    }

    void loadCard();

    return () => {
      cancelled = true;
    };
  }, [cardId, eventSlug, router]);

  const isCenterCard = useMemo(
    () => (card?.assigned_card?.display_mode || card?.display_mode) === "center",
    [card],
  );

  if (loading) {
    return <StateShell title="卡片載入中" description="正在讀取卡片內容。" />;
  }

  if (!card) {
    return <StateShell title="找不到卡片" description={error || "目前沒有可顯示的卡片內容。"} />;
  }

  if (isCenterCard) {
    const centerText = card.assigned_card?.center_text || card.center_text || card.assigned_card?.title || card.title;
    return (
      <main className="flex min-h-screen flex-col bg-foreground text-background">
        <div className="flex items-center justify-between px-6 py-5 text-sm text-background/70">
          <span>{eventTitle}</span>
          <Button asChild variant="secondary" size="icon" className="rounded-full">
            <Link href={`/events/${eventSlug}?tab=cards`} aria-label="關閉卡片">
              <X className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-10">
          <div className="w-full md:rounded-[3rem] md:border md:border-background/20 md:px-10 md:py-14 md:shadow-[0_0_160px_-40px_rgba(255,255,255,0.4)]">
            <p className="text-center text-[clamp(3.5rem,18vw,14rem)] font-semibold tracking-[0.28em] md:tracking-[0.5em]">
              {centerText}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{eventTitle}</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground md:text-4xl">
            {card.assigned_card?.title || card.title}
          </h1>
        </div>
        <Button asChild variant="outline" size="icon" className="rounded-full md:hidden">
          <Link href={`/events/${eventSlug}?tab=cards`} aria-label="關閉卡片">
            <X className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="hidden rounded-full md:inline-flex">
          <Link href={`/events/${eventSlug}?tab=cards`}>返回活動頁</Link>
        </Button>
      </div>
      <section className="p-0 md:max-h-[72vh] md:overflow-y-auto md:rounded-4xl md:border md:border-border/80 md:bg-card/90 md:p-8 md:shadow-[0_30px_120px_-60px_rgba(80,40,10,0.45)]">
        <SimpleMarkdown content={card.assigned_card?.content_markdown || card.content_markdown} />
      </section>
    </main>
  );
}

function StateShell({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="max-w-xl rounded-4xl border border-border/80 bg-card/85 p-10 text-center">
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        <p className="mt-4 text-base leading-8 text-muted-foreground">{description}</p>
      </div>
    </main>
  );
}
