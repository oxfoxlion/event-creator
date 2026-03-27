"use client";

import { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";

type AdminShellProps = {
  title: string;
  description: string;
  eventId?: string;
  children: ReactNode;
};

export function AdminShell({ title, description, eventId, children }: AdminShellProps) {
  return (
    <WorkspaceShell
      title={title}
      description={description}
      sectionLabel={eventId ? `主辦活動 ${eventId}` : "主辦管理"}
    >
      {children}
    </WorkspaceShell>
  );
}
