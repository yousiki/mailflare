"use client";

import Link from "next/link";
import { HelpCircle, Search } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ComposeProvider } from "@/components/compose/compose-context";
import { FloatingComposer } from "@/components/compose/floating-composer";
import { MailboxProvider } from "@/components/mailbox-provider";
import { MailboxSelector } from "@/components/mailbox-selector";
import { AdminNav } from "@/components/admin-nav";
import { SidebarProvider } from "@/components/sidebar-state";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireMailbox requireRole="admin">
      <SidebarProvider expandedWidth={256}>
        <MailboxProvider>
          <ComposeProvider>
            <div className="grid h-dvh grid-cols-[var(--sidebar-width)_minmax(0,1fr)] overflow-hidden bg-[#f6f8fc] transition-[grid-template-columns] duration-200">
              <aside className="min-h-0 overflow-y-auto overscroll-contain px-3 py-4 scrollbar-gutter-stable">
                <AdminNav />
              </aside>
              <div className="flex min-h-0 min-w-0 flex-col">
                <span className="fixed top-6 right-6 flex items-center gap-2">
                  <MailboxSelector />
                </span>
                <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-tl-3xl px-6 py-10 scrollbar-gutter-stable lg:px-12">
                  <div className="w-full max-w-3xl">{children}</div>
                </main>
              </div>
              <FloatingComposer />
            </div>
          </ComposeProvider>
        </MailboxProvider>
      </SidebarProvider>
    </AuthGuard>
  );
}
