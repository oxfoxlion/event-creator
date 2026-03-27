"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminDeck, AdminEvent, getAdminDecks, getAdminEvents } from "@/lib/eventCreatorApi";

export function AdminClaimManagementClient() {
  const router = useRouter();
  const [decks, setDecks] = useState<AdminDeck[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      const eventsResult = await getAdminEvents();

      if (cancelled) {
        return;
      }

      if (eventsResult.status === 401) {
        router.replace("/login?redirect_to=%2Fadmin%2Fdecks");
        return;
      }

      if (!eventsResult.data) {
        setError(eventsResult.error || "讀取牌組管理資料失敗");
        setLoading(false);
        return;
      }

      const deckResults = await Promise.all(
        eventsResult.data.events.map(async (event) => {
          const result = await getAdminDecks(event.id);
          return {
            event,
            result,
          };
        }),
      );

      if (cancelled) {
        return;
      }

      const deckError = deckResults.find(({ result }) => !result.data)?.result.error;
      if (deckError) {
        setError(deckError || "讀取牌組失敗");
        setLoading(false);
        return;
      }

      setEvents(eventsResult.data.events);
      setDecks(
        deckResults.flatMap(({ event, result }) =>
          (result.data?.decks || []).map((deck) => ({
            ...deck,
            event_title: event.title,
          })),
        ) as Array<AdminDeck & { event_title: string }>,
      );
      setError(null);
      setLoading(false);
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const filteredDecks = (decks as Array<AdminDeck & { event_title: string }>).filter((deck) =>
    selectedEventId === "all" ? true : deck.event_id === selectedEventId,
  );

  const createDeckHref =
    selectedEventId !== "all"
      ? `/admin/decks/new?eventId=${selectedEventId}`
      : events[0]
        ? `/admin/decks/new?eventId=${events[0].id}`
        : "/admin/events/new";

  return (
    <AdminShell title="牌組管理" description="先查看自己主辦活動的牌組列表，再進入牌組頁管理卡片、模板與核銷。">
      <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">牌組列表</h2>
            <p className="mt-2 text-sm text-muted-foreground">先從這裡找到要管理的牌組，再進入獨立牌組頁調整規則與卡片內容。</p>
          </div>
          <Button asChild className="rounded-full px-5">
            <Link href={createDeckHref}>新增牌組</Link>
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-end gap-4 rounded-3xl border border-border/80 bg-background/65 p-4">
          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">活動篩選</span>
            <select
              className="min-w-[220px] rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
            >
              <option value="all">全部活動</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-muted-foreground">
            {selectedEventId === "all"
              ? `目前顯示全部活動，共 ${filteredDecks.length} 組牌組。`
              : `目前顯示所選活動，共 ${filteredDecks.length} 組牌組。`}
          </p>
        </div>
        <div className="mt-6 grid gap-4">
          {loading ? <p className="text-sm text-muted-foreground">牌組列表載入中...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {filteredDecks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-background/65 p-8 text-center text-muted-foreground">
              目前沒有符合條件的牌組，請先建立牌組或調整活動篩選。
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border/80 bg-background/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">活動</TableHead>
                    <TableHead className="min-w-[180px]">牌組</TableHead>
                    <TableHead className="min-w-[140px]">規則</TableHead>
                    <TableHead className="min-w-[120px]">內容數量</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="w-[260px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDecks.map((deck) => (
                    <TableRow key={deck.id}>
                      <TableCell className="whitespace-nowrap font-medium text-foreground">
                        <Link
                          href={`/admin/events/${deck.event_id}`}
                          className="transition-colors hover:text-primary"
                        >
                          {deck.event_title}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div>
                          <p className="font-medium text-foreground">{deck.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{translateDeckStatus(deck.status)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {deck.deck_rule === "single_card" ? "單一卡片牌組" : "隨機抽卡牌組"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {deck.deck_rule === "single_card" ? "單一卡片" : `${deck.cards.length} 種內容`}
                      </TableCell>
                      <TableCell className="min-w-[220px] max-w-xs text-muted-foreground">
                        {deck.description || "尚未填寫牌組描述。"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild className="rounded-full px-4">
                            <Link href={`/admin/decks/${deck.id}?eventId=${deck.event_id}`}>管理牌組</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function translateDeckStatus(status: "active" | "archived") {
  return status === "active" ? "啟用中" : "已封存";
}
