"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildDiscordLoginUrl,
  buildGoogleLoginUrl,
  postPasswordLogin,
  postPasswordRegister,
} from "@/lib/eventCreatorApi";

type LoginPanelProps = {
  redirectTo?: string;
};

type PasswordMode = "login" | "register";

export function LoginPanel({ redirectTo }: LoginPanelProps) {
  const target = redirectTo?.startsWith("/") ? redirectTo : "/dashboard";
  const [mode, setMode] = useState<PasswordMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result =
      mode === "login"
        ? await postPasswordLogin({ email, password })
        : await postPasswordRegister({ email, password, displayName: displayName.trim() || undefined });

    setSubmitting(false);

    if (!result.data) {
      setError(result.error || (mode === "login" ? "登入失敗" : "註冊失敗"));
      return;
    }

    window.location.assign(target);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-4xl border border-border/80 bg-card/85 p-8 shadow-[0_30px_120px_-50px_rgba(120,70,20,0.45)] backdrop-blur sm:p-12">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
            活動卡片平台
          </p>
          <h1 className="max-w-2xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
            掃描活動 QR code 後，從這裡登入並回到原本的活動入口。
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            你現在可以用 Google、Discord，或直接用 email + password 註冊 / 登入。登入完成後會自動回到原本要去的活動頁或工作區。
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg" className="rounded-full px-6">
              <a href={buildGoogleLoginUrl(target)}>使用 Google 登入</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <a href={buildDiscordLoginUrl(target)}>使用 Discord 登入</a>
            </Button>
          </div>

          <div className="mt-8 rounded-3xl border border-border/70 bg-background/75 p-5">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={mode === "login" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                帳號密碼登入
              </Button>
              <Button
                type="button"
                variant={mode === "register" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
              >
                帳號密碼註冊
              </Button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
              {mode === "register" ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">顯示名稱</span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="例如：Shao"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                  />
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 8 碼"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                  required
                  minLength={8}
                />
              </label>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
                {submitting ? (mode === "login" ? "登入中..." : "註冊中...") : mode === "login" ? "登入" : "註冊並登入"}
              </Button>
            </form>
          </div>
        </div>

        <aside className="rounded-4xl border border-border/80 bg-gradient-to-br from-accent/50 via-card/90 to-secondary/80 p-8 shadow-[0_24px_80px_-50px_rgba(80,50,10,0.5)]">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            這次登入會發生什麼
          </p>
          <ul className="mt-8 space-y-4 text-sm leading-7 text-foreground/88">
            <li>1. 你可以選 Google、Discord 或 email + password。</li>
            <li>2. 登入成功後，系統會保留同一個活動卡片帳號。</li>
            <li>3. 會自動回到原本指定的活動頁、分享頁或工作區。</li>
            <li>4. 之後即可簽到、領卡、查看活動紀錄或進入後台。</li>
          </ul>
          <div className="mt-10 rounded-3xl border border-border/70 bg-background/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">登入後導向</p>
            <p className="mt-2 break-all text-sm font-medium text-foreground">{target}</p>
          </div>
          <div className="mt-4">
            <Button asChild size="lg" variant="outline" className="w-full rounded-full px-6">
              <Link href="/">回到首頁</Link>
            </Button>
          </div>
        </aside>
      </section>
    </main>
  );
}
