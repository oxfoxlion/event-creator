"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AdminDeckEditorClient } from "@/components/admin-deck-editor-client";
import { AdminShell } from "@/components/admin-shell";
import { AdminEvent, getAdminDecks, getAdminEvents } from "@/lib/eventCreatorApi";

type AdminDeckRouteClientProps = {
  deckId?: string;
};

export function AdminDeckRouteClient({ deckId }: AdminDeckRouteClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "";
  const isNew = !deckId;
  const [resolvedEventId, setResolvedEventId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setLoading(true);
      const eventsResult = await getAdminEvents();

      if (cancelled) {
        return;
      }

      if (eventsResult.status === 401) {
        const redirectTo = deckId ? `/admin/decks/${deckId}` : "/admin/decks/new";
        router.replace(`/login?redirect_to=${encodeURIComponent(redirectTo)}`);
        return;
      }

      if (!eventsResult.data) {
        setError(eventsResult.error || "讀取活動列表失敗");
        setLoading(false);
        return;
      }

      setEvents(eventsResult.data.events);

      if (isNew) {
        const matchedEvent = initialEventId
          ? eventsResult.data.events.find((event) => event.id === initialEventId)
          : null;
        setSelectedEventId(matchedEvent?.id || "");
        setLoading(false);
        return;
      }

      for (const event of eventsResult.data.events) {
        const decksResult = await getAdminDecks(event.id);

        if (cancelled) {
          return;
        }

        if (!decksResult.data) {
          continue;
        }

        if (decksResult.data.decks.some((deck) => deck.id === deckId)) {
          setResolvedEventId(event.id);
          setLoading(false);
          return;
        }
      }

      setError("找不到對應的牌組或活動。");
      setLoading(false);
    }

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [deckId, initialEventId, isNew, router]);

  if (!loading && !error && ((!isNew && resolvedEventId) || (isNew && events.length > 0))) {
    return (
      <AdminDeckEditorClient
        eventId={isNew ? selectedEventId : resolvedEventId}
        deckId={deckId}
        events={isNew ? events : []}
        onEventChange={isNew ? setSelectedEventId : undefined}
      />
    );
  }

  return (
    <AdminShell
      title={isNew ? "新增牌組" : "牌組管理"}
      description={isNew ? "先選擇要掛載到哪一場活動，再進入牌組編輯。" : "正在解析牌組所屬活動。"}
    >
      <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
        {loading ? <p className="text-sm text-muted-foreground">牌組路由解析中...</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!loading && !error && isNew && events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 bg-background/65 p-8 text-center text-muted-foreground">
            目前還沒有可用活動，請先建立活動。
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
