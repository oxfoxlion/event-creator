"use client";

import { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";

type ParticipantShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ParticipantShell({ title, description, children }: ParticipantShellProps) {
  return (
    <WorkspaceShell
      title={title}
      description={description}
      sectionLabel="使用者空間"
    >
      {children}
    </WorkspaceShell>
  );
}
