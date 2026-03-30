"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleUserRound,
  CalendarRange,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  LogIn,
  Menu,
  PlusCircle,
  Settings2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser, postLogout, type SessionUser } from "@/lib/eventCreatorApi";
import { cn } from "@/lib/utils";

type WorkspaceShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  headerActions?: ReactNode;
  sectionLabel: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  matches?: (pathname: string) => boolean;
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "參加者",
    items: [
      { href: "/dashboard", label: "儀表板", icon: LayoutDashboard },
      { href: "/me/events", label: "參與過的活動", icon: CalendarRange },
    ],
  },
  {
    title: "主辦方",
    items: [
      {
        href: "/admin/events",
        label: "我的活動",
        icon: PlusCircle,
        matches: (pathname) =>
          pathname === "/admin/events" ||
          pathname === "/admin/events/new" ||
          /^\/admin\/events\/[^/]+$/.test(pathname),
      },
      {
        href: "/admin/decks",
        label: "牌組管理",
        icon: Settings2,
        matches: (pathname) =>
          pathname === "/admin/decks" ||
          pathname.startsWith("/admin/decks/") ||
          /^\/admin\/events\/[^/]+\/decks(?:\/.*)?$/.test(pathname),
      },
    ],
  },
];

export function WorkspaceShell({
  title,
  description,
  children,
  headerActions,
  sectionLabel,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const result = await getCurrentUser();
      if (cancelled || !result.data?.user) {
        return;
      }
      setUser(result.data.user);
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await postLogout();
    setLoggingOut(false);
    router.replace("/login");
  }

  return (
    <main className="min-h-screen w-full">
      <div className="lg:hidden">
        <div className="px-4 pt-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-2xl"
            onClick={() => setMobileOpen(true)}
            aria-label="開啟側邊欄"
          >
            <Menu className="size-4" />
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="關閉側邊欄"
          />
          <aside className="absolute left-0 top-0 h-full w-[88vw] max-w-sm">
            <SidebarCard
              collapsed={false}
              pathname={pathname}
              user={user}
              onClose={() => setMobileOpen(false)}
              onLogout={handleLogout}
              loggingOut={loggingOut}
              onToggleCollapse={undefined}
            />
          </aside>
        </div>
      ) : null}

      <div
        className={cn(
          "grid items-start transition-[grid-template-columns] duration-300 lg:min-h-screen",
          collapsed ? "lg:grid-cols-[88px_minmax(0,1fr)]" : "lg:grid-cols-[280px_minmax(0,1fr)]",
        )}
      >
        <div className="hidden lg:block">
          <SidebarCard
            collapsed={collapsed}
            pathname={pathname}
            user={user}
            onClose={undefined}
            onLogout={handleLogout}
            loggingOut={loggingOut}
            onToggleCollapse={() => setCollapsed((current) => !current)}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <Card className="bg-card/90 shadow-[0_30px_120px_-70px_rgba(90,45,10,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-4 p-6 sm:p-8">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">{sectionLabel}</p>
                <h2 className="mt-3 text-4xl font-semibold text-foreground">{title}</h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">{description}</p>
              </div>
              {headerActions ? <div className="flex flex-wrap gap-3">{headerActions}</div> : null}
            </div>
          </Card>
          {children}
        </div>
      </div>
    </main>
  );
}

function SidebarCard({
  collapsed,
  pathname,
  user,
  onToggleCollapse,
  onLogout,
  loggingOut,
  onClose,
}: {
  collapsed: boolean;
  pathname: string;
  user: SessionUser | null;
  onToggleCollapse?: () => void;
  onLogout: () => void;
  loggingOut: boolean;
  onClose?: () => void;
}) {
  const loginHref = `/login?redirect_to=${encodeURIComponent(pathname || "/dashboard")}`;
  const displayName = user?.display_name || user?.discord_username || user?.email || "尚未登入";
  const subLabel = user?.email || (user?.discord_username ? `@${user.discord_username}` : "尚未登入");

  return (
    <aside className="flex h-full flex-col overflow-hidden border-r border-sidebar-border/80 bg-sidebar/98 lg:sticky lg:top-0 lg:h-screen">
      <div
        className={cn(
          "border-b border-sidebar-border/80 transition-all duration-300",
          collapsed ? "px-3 py-4" : "px-6 py-6",
        )}
      >
        <div className={cn("flex items-start justify-between gap-3", collapsed && "flex-col items-center")}>
          <div className={cn("min-w-0", collapsed ? "flex flex-col items-center" : "flex min-w-0 items-center gap-3")}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={displayName || "使用者頭像"}
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <CircleUserRound className="size-5" />
              )}
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/58">
                  {user ? subLabel : "尚未登入"}
                </p>
              </div>
            ) : null}
          </div>

          <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
            {onToggleCollapse ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-xl text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={onToggleCollapse}
                aria-label={collapsed ? "展開側邊欄" : "摺疊側邊欄"}
                title={collapsed ? "展開側邊欄" : "摺疊側邊欄"}
              >
                {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
              </Button>
            ) : null}
            {onClose ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-xl text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={onClose}
                aria-label="關閉側邊欄"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
        {!collapsed ? (
          <div className="mt-4">
            {user ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start rounded-xl text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={onLogout}
                disabled={loggingOut}
              >
                <LogOut className="size-4" />
                <span>{loggingOut ? "登出中..." : "登出"}</span>
              </Button>
            ) : (
              <Button asChild variant="ghost" className="w-full justify-start rounded-xl text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <Link href={loginHref} onClick={onClose}>
                  <LogIn className="size-4" />
                  <span>登入</span>
                </Link>
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <div className={cn("flex flex-1 flex-col gap-5 py-4", collapsed ? "px-2" : "px-4")}>
        {navGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-2">
            {!collapsed ? (
              <p className="px-3 text-xs font-medium uppercase tracking-[0.18em] text-sidebar-foreground/54">
                {group.title}
              </p>
            ) : null}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.matches
                ? item.matches(pathname)
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-2xl text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-3 py-3" : "gap-3 px-4 py-3",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/82 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  onClick={onClose}
                >
                  <Icon className="size-4" />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
