"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ParticipantShell } from "@/components/participant-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinedEvent, OwnedClaim, getJoinedEvents, getOwnedClaims } from "@/lib/eventCreatorApi";

export function DashboardClient() {
  const router = useRouter();
  const [events, setEvents] = useState<JoinedEvent[]>([]);
  const [claims, setClaims] = useState<OwnedClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      const [eventsResult, claimsResult] = await Promise.all([getJoinedEvents(), getOwnedClaims()]);

      if (cancelled) {
        return;
      }

      if (eventsResult.status === 401 || claimsResult.status === 401) {
        router.replace("/login?redirect_to=%2Fdashboard");
        return;
      }

      if (!eventsResult.data || !claimsResult.data) {
        setError(eventsResult.error || claimsResult.error || "讀取儀表板失敗");
        setLoading(false);
        return;
      }

      setEvents(eventsResult.data.events);
      setClaims(claimsResult.data.claims);
      setError(null);
      setLoading(false);
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const activeEvents = events.filter((event) => event.status === "published").slice(0, 3);
  const latestClaims = claims.slice(0, 4);

  return (
    <ParticipantShell
      title="儀表板"
      description="登入後的主入口。從這裡可以回到正在進行的活動、查看近期拿到的卡片，或直接前往主辦管理頁面。"
    >
      {loading ? (
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">正在讀取你的活動與卡片摘要...</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>當前進行中的活動</CardTitle>
                <CardDescription>優先顯示目前狀態為進行中的活動。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeEvents.length === 0 ? (
                  <EmptyState
                    title="目前沒有進行中的活動"
                    description="你還沒有進入任何已發布活動，或活動目前都不在進行狀態。"
                  />
                ) : (
                  activeEvents.map((event) => (
                    <article key={event.id} className="rounded-3xl border border-border/80 bg-background/75 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{translateEventStatus(event.status)}</p>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">{event.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {event.description || "活動尚未補上描述。"}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button asChild className="rounded-full px-5">
                          <Link href={`/events/${event.slug}?tab=cards`}>前往活動</Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full px-5">
                          <Link href="/me/events">查看全部活動</Link>
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>近期卡片</CardTitle>
                <CardDescription>顯示最近領取的卡片，協助你快速掌握最近拿到的內容。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestClaims.length === 0 ? (
                  <EmptyState title="目前沒有卡片" description="簽到或抽卡後，這裡會顯示你最近領到的內容。" />
                ) : (
                  latestClaims.map((claim) => (
                    <article key={claim.claim_id} className="rounded-3xl border border-border/80 bg-background/75 p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{claim.event_title}</p>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">{claim.card.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        狀態：{claim.usage_status === "unused" ? "未使用" : claim.usage_status === "used" ? "已使用" : "已關閉"}
                      </p>
                    </article>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>快速入口</CardTitle>
                <CardDescription>常用的參加者與主辦方操作。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <QuickLink href="/me/events" label="參與過的活動" description="查看活動紀錄與已領卡數量。" />
                <QuickLink href="/admin/events" label="我的活動" description="查看自己主辦的活動，並進入活動與卡片管理。" />
                <QuickLink href="/admin/decks" label="牌組管理" description="查看全部牌組，並進入獨立牌組頁管理卡片。" />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </ParticipantShell>
  );
}

function QuickLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-border/80 bg-background/75 p-5 transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <p className="text-base font-semibold">{label}</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
    </Link>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border/80 bg-background/65 p-8 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}

function translateEventStatus(status: string) {
  switch (status) {
    case "draft":
      return "草稿"
    case "published":
      return "進行中"
    case "archived":
      return "已封存"
    default:
      return status
  }
}
