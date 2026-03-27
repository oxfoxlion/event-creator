import Link from "next/link";
import { CalendarCheck2, Package, QrCode, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const featureCards = [
  {
    title: "活動進場",
    description: "掃描 QR code 後快速登入，直接進入指定活動頁面。",
    icon: QrCode,
  },
  {
    title: "卡片玩法",
    description: "支援固定發卡、抽卡牌組、必領卡與可選卡，適合現場互動與遊戲設計。",
    icon: Package,
  },
  {
    title: "簽到與流程",
    description: "活動開始、簽到開放與卡片發布時間可獨立管理，方便現場控場。",
    icon: CalendarCheck2,
  },
  {
    title: "卡片核銷",
    description: "參加者可依規則自行標記已使用，或由主辦方後台統一處理。",
    icon: ShieldCheck,
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-background/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">活動卡片平台</p>
            <p className="mt-1 text-lg font-semibold text-foreground">以卡片為核心的實體活動平台</p>
          </div>
          <nav className="flex items-center gap-3">
            <Button asChild variant="ghost" className="rounded-full">
              <a href="#how-it-works">操作說明</a>
            </Button>
            <Button asChild className="rounded-full px-5">
              <Link href="/login">登入</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-18">
        <div className="flex flex-col justify-center">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">實體活動工具組</p>
          <h1 className="mt-5 max-w-4xl font-heading text-5xl font-semibold leading-tight text-foreground sm:text-6xl lg:text-7xl">
            把簽到、發卡、抽卡與核銷整理成一個真的能現場使用的平台。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            這個平台讓主辦方以卡片為核心設計現場活動。參加者登入後可簽到、領取卡片、查看活動內卡片；主辦方則可管理活動、牌組、發卡規則與卡片狀態。
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/login">使用 Discord 登入</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link href="/admin/events">查看主辦後台</Link>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden bg-gradient-to-br from-accent/45 via-card to-secondary/75 shadow-[0_30px_140px_-70px_rgba(90,45,10,0.5)]">
          <CardHeader className="border-b border-border/70">
            <CardTitle>平台現在可以處理的核心流程</CardTitle>
            <CardDescription>從進場到核銷，所有操作集中在同一套前後台。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <TimelineItem step="1" title="掃碼進場" description="活動 QR code 導向登入頁，保留活動目的地。" />
            <TimelineItem step="2" title="Discord 登入" description="登入後直接回到使用者儀表板或指定活動。" />
            <TimelineItem step="3" title="簽到與領卡" description="簽到後自動補發必領卡，或讓參加者自行抽卡。" />
            <TimelineItem step="4" title="活動卡片與核銷" description="參加者在活動內查看自己的卡片，核銷規則可由活動建立者決定。" />
          </CardContent>
        </Card>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="bg-card/88">
                <CardHeader>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="pt-3">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function TimelineItem({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">步驟 {step}</p>
      <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}
