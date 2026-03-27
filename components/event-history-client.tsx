"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ParticipantShell } from "@/components/participant-shell";
import { Button } from "@/components/ui/button";
import { JoinedEvent, getJoinedEvents } from "@/lib/eventCreatorApi";

export function EventHistoryClient() {
  const router = useRouter();
  const [events, setEvents] = useState<JoinedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      const result = await getJoinedEvents();

      if (cancelled) {
        return;
      }

      if (result.status === 401) {
        router.replace("/login?redirect_to=%2Fme%2Fevents");
        return;
      }

      if (!result.data) {
        setError(result.error || "讀取活動紀錄失敗");
        setLoading(false);
        return;
      }

      setEvents(result.data.events);
      setError(null);
      setLoading(false);
    }

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return <StateShell title="讀取我的活動" description="正在載入你曾經參加過的活動。" />;
  }

  if (error) {
    return <StateShell title="活動紀錄讀取失敗" description={error} />;
  }

  return (
    <ParticipantShell
      title="參與過的活動"
      description="查看自己簽到過的活動、已領卡數量，以及重新回到活動現場頁。"
    >
      <section className="grid gap-4">
        {events.length === 0 ? (
          <div className="rounded-4xl border border-border/80 bg-card/85 p-10 text-center text-muted-foreground">
            目前還沒有任何活動紀錄。
          </div>
        ) : (
          events.map((event) => (
            <article
              key={event.id}
              className="rounded-4xl border border-border/80 bg-card/85 p-6 shadow-[0_24px_90px_-70px_rgba(80,40,10,0.5)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    {new Date(event.checked_in_at).toLocaleString("zh-TW")}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground">{event.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                    {event.description || "這個活動尚未補上描述。"}
                  </p>
                </div>
                <div className="rounded-3xl border border-border/80 bg-background/80 px-4 py-3 text-sm text-foreground/80">
                  已領取 {event.claimed_card_count} 張卡
                </div>
              </div>
              <div className="mt-5">
                <Button asChild className="rounded-full px-5">
                  <Link href={`/events/${event.slug}?tab=cards`}>查看活動</Link>
                </Button>
              </div>
            </article>
          ))
        )}
      </section>
    </ParticipantShell>
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
