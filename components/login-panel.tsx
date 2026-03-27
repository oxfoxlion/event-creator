"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buildDiscordLoginUrl } from "@/lib/eventCreatorApi";

type LoginPanelProps = {
  redirectTo?: string;
};

export function LoginPanel({ redirectTo }: LoginPanelProps) {
  const target = redirectTo?.startsWith("/") ? redirectTo : "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-4xl border border-border/80 bg-card/85 p-8 shadow-[0_30px_120px_-50px_rgba(120,70,20,0.45)] backdrop-blur sm:p-12">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
            活動卡片平台
          </p>
          <h1 className="max-w-2xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
            掃描活動 QR code 後，從這裡進場。
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            以 Discord 身份登入後，你可以完成簽到、領取活動卡片，並查看自己曾經參加過的活動。
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-6">
              <a href={buildDiscordLoginUrl(target)}>使用 Discord 登入</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link href="/">回到首頁</Link>
            </Button>
          </div>
        </div>

        <aside className="rounded-4xl border border-border/80 bg-gradient-to-br from-accent/50 via-card/90 to-secondary/80 p-8 shadow-[0_24px_80px_-50px_rgba(80,50,10,0.5)]">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            MVP 入口
          </p>
          <ul className="mt-8 space-y-4 text-sm leading-7 text-foreground/88">
            <li>1. 掃描活動 QR code 進到登入頁</li>
            <li>2. 用 Discord 登入後導向使用者儀表板</li>
            <li>3. 完成簽到後領取卡片或抽卡</li>
            <li>4. 在活動頁查看當次活動的卡片內容</li>
          </ul>
          <div className="mt-10 rounded-3xl border border-border/70 bg-background/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">登入後導向</p>
            <p className="mt-2 break-all text-sm font-medium text-foreground">{target}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
