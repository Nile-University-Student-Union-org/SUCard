"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { AuthLayout } from "@/components/ui/auth-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function VerifyAdminFactor() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const verification = backup
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
        : await authClient.twoFactor.verifyTotp({ code: code.trim() });
      if (verification.error) {
        setError(verification.error.status === 429 ? "Too many attempts. Try again later." : "Invalid code. Try again.");
        return;
      }
    } catch {
      setError("Could not verify your code. Check your connection and try again.");
      return;
    } finally {
      setBusy(false);
    }
    router.push("/go");
  }

  return <AuthLayout backHref="/login" backLabel="Back to login">
    <Card className="mx-auto max-w-md space-y-5 p-6">
      <h1 className="font-heading text-3xl">VERIFY YOUR IDENTITY</h1>
      <p>Enter a code from your authenticator app to access the admin panel.</p>
      <form onSubmit={verify} className="space-y-4">
        <Input label={backup ? "Backup code" : "Authenticator code"} value={code}
          onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" />
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button type="submit" disabled={busy || !code.trim()}>Verify</Button>
      </form>
      <Button type="button" variant="ghost" onClick={() => { setBackup(!backup); setCode(""); setError(""); }}>
        {backup ? "Use authenticator code" : "Use a backup code"}
      </Button>
    </Card>
  </AuthLayout>;
}
