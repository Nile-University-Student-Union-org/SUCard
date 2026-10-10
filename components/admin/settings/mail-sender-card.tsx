"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MailerStatus = { status: "connected" | "disconnected"; accountEmail: string | null;
  lastError: string | null; queuedCount: number; configured: boolean };
const notices: Record<string, string> = {
  connected: "Mail sender connected.", state: "Connection expired or was interrupted. Try connecting again.",
  consent: "Microsoft requires admin approval for mail permissions. Ask your Microsoft 365 admin to grant consent, then reconnect.",
  authorization: "Microsoft sign-in did not complete. Try connecting again.",
  token: "Microsoft could not finish the connection. Try connecting again.",
  account: "Sign in as the SU mail account to connect this sender.",
  configuration: "Mail sender configuration is incomplete. Contact the app administrator.",
};

export function MailSenderCard() {
  const [status, setStatus] = useState<MailerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const flag = new URLSearchParams(window.location.search).get("mailer");
    if (flag)
      window.history.replaceState(null, "", window.location.pathname);
    fetch("/api/admin/mailer/status", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Mail sender status is unavailable.");
      setStatus(await response.json() as MailerStatus);
      if (flag && notices[flag]) setError(notices[flag]);
    }).catch(() => setError("Mail sender status is unavailable. Reload the page to try again."));
  }, []);

  async function disconnect() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/mailer/microsoft/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("Could not disconnect the mail sender.");
      setStatus((current) => current ? { ...current, status: "disconnected", lastError: null } : current);
      setError(null);
    } catch {
      setError("Could not disconnect the mail sender. Try again.");
    } finally { setBusy(false); }
  }

  return <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-2xl">
    <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
      <CardTitle className="text-xl sm:text-2xl text-foreground flex items-center gap-2.5">
        <Mail className="size-5 text-brand dark:text-brand-soft shrink-0" />Mail sender
      </CardTitle>
      <CardDescription>Send account and password emails from the SU Microsoft account.</CardDescription>
    </CardHeader>
    <CardContent className="p-5 sm:p-6 space-y-3">
      <p className="text-sm font-semibold text-foreground" aria-live="polite">
        {status?.status === "connected" ? `Connected as ${status.accountEmail}` : status?.lastError ? `Disconnected: ${status.lastError}` : "Not connected"}
      </p>
      <p className="text-sm text-muted-foreground">{status ? `${status.queuedCount} emails waiting to send` : "Loading queue…"}</p>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {status && !status.configured && <p className="text-sm text-destructive">Set MAILER_TOKEN_KEY on the server to enable connection.</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" disabled={!status?.configured || busy} onClick={() => { window.location.assign(new URL("/api/admin/mailer/microsoft/connect", window.location.origin)); }}>
          {status?.status === "connected" ? "Reconnect" : "Connect"}
        </Button>
        {status?.status === "connected" && <Button variant="secondary" disabled={busy} onClick={() => void disconnect()}>Disconnect</Button>}
      </div>
    </CardContent>
  </Card>;
}
