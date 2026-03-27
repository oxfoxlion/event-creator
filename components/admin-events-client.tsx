"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { AdminEvent, getAdminEvents } from "@/lib/eventCreatorApi";

export function AdminEventsClient() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      setLoading(true);
      const result = await getAdminEvents();

      if (cancelled) {
        return;
      }

      if (result.status === 401) {
        router.replace("/login?redirect_to=%2Fadmin%2Fevents");
        return;
      }

      if (!result.data) {
        setError(result.error || "讀取活動列表失敗");
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

  return (
    <AdminShell title="我的活動" description="查看自己主辦的活動，並進入活動設定、分享與活動牌組。">
      <section className="rounded-4xl border border-border/80 bg-card/85 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">我的活動</h2>
            <p className="mt-2 text-sm text-muted-foreground">第一版預設由建立者成為該活動的擁有者。</p>
          </div>
          <Button asChild className="rounded-full px-5">
            <Link href="/admin/events/new">建立新活動</Link>
          </Button>
        </div>
        {loading ? <p className="mt-6 text-sm text-muted-foreground">活動載入中...</p> : null}
        {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}
        {!loading && !error ? (
          <div className="mt-6 grid gap-4">
            {events.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/80 bg-background/65 p-8 text-center text-muted-foreground">
                你目前還沒有任何活動，先建立第一個活動吧。
              </div>
            ) : (
              events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-3xl border border-border/80 bg-background/70 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{event.slug}</p>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">{event.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {event.description || "尚未填寫活動描述。"}
                      </p>
                    </div>
                    <div className="rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-medium text-foreground/84">
                      {translateRole(event.role)} / {translateEventStatus(event.status)}
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild className="rounded-full px-5">
                      <Link href={`/admin/events/${event.id}`}>活動設定</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full px-5">
                      <Link href={`/admin/events/${event.id}?tab=decks`}>活動牌組</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full px-5">
                      <Link href={`/admin/decks/new?eventId=${event.id}`}>新增牌組</Link>
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}

function translateRole(role?: string) {
  switch (role) {
    case "owner":
      return "擁有者"
    case "editor":
      return "編輯者"
    default:
      return role || "擁有者"
  }
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
