"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCairoDate } from "./utils";
import type { StudentAdminGrant } from "@/lib/staff/student-admin-service";

type Match = { universityId: string; studentName: string | null };

async function api<T>(method: string, path: string, ids?: string): Promise<T> {
  const response = await fetch(path, { method, cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: ids === undefined ? undefined : JSON.stringify({ ids }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export function StudentAdmins() {
  const [grants, setGrants] = useState<StudentAdminGrant[]>([]);
  const [ids, setIds] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [checkedIds, setCheckedIds] = useState("");
  const [revoke, setRevoke] = useState<StudentAdminGrant | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<{ grants: StudentAdminGrant[] }>("GET", "/api/admin/staff/student-admins")
      .then((data) => { if (active) setGrants(data.grants); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load student admins"); });
    return () => { active = false; };
  }, []);

  async function preview() {
    setBusy(true);
    try {
      const data = await api<{ students: Match[] }>("PUT", "/api/admin/staff/student-admins", ids);
      setMatches(data.students);
      setCheckedIds(ids);
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not check IDs"); }
    finally { setBusy(false); }
  }
  async function grant() {
    setBusy(true);
    try {
      const data = await api<{ grants: StudentAdminGrant[] }>("POST", "/api/admin/staff/student-admins", checkedIds);
      setGrants(data.grants);
      setIds(""); setMatches(null); setCheckedIds(""); setError(null);
      toast.success("Student admin access granted");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not grant access"); }
    finally { setBusy(false); }
  }
  async function confirmRevoke() {
    if (!revoke) return;
    setBusy(true);
    try {
      await api("DELETE", `/api/admin/staff/student-admins/${revoke.universityId}`);
      setGrants((current) => current.filter((grant) => grant.universityId !== revoke.universityId));
      setRevoke(null);
      toast.success("Student admin access revoked");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not revoke access"); }
    finally { setBusy(false); }
  }

  return <Card className="border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
    <CardHeader className="border-b border-slate-100 dark:border-zinc-800">
      <CardTitle className="text-lg sm:text-xl">Student admins</CardTitle>
      <CardDescription>Grant admin access to NU students by university ID. Students retain their student area.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5 p-5">
      <div className="space-y-2">
        <Textarea
          id="student-admin-ids"
          label="University IDs"
          value={ids}
          onChange={(event) => {
            setIds(event.target.value);
            setMatches(null);
          }}
          placeholder="Enter 9-digit IDs, separated by commas or new lines"
          rows={3}
        />
        <Button type="button" variant="outline" onClick={preview} disabled={busy || !ids.trim()}>Check IDs</Button>
      </div>
      {matches && <div className="space-y-3 rounded-xl border border-border p-4">
        <p className="text-sm font-bold">Ready to grant ({matches.length})</p>
        <ul className="max-h-44 space-y-1 overflow-auto text-sm">
          {matches.map((match) => <li key={match.universityId}><span className="font-mono">{match.universityId}</span> — {match.studentName ?? "No linked student yet"}</li>)}
        </ul>
        <Button type="button" variant="primary" onClick={grant} disabled={busy || ids !== checkedIds}>
          <ShieldCheck className="mr-2 size-4" />Grant admin access
        </Button>
      </div>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="space-y-2">
        <h3 className="text-sm font-bold">Active grants ({grants.length})</h3>
        {grants.length === 0 ? <p className="text-sm text-muted-foreground">No student admins yet.</p> :
          <div className="space-y-2">{grants.map((grant) => <div key={grant.universityId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
            <div><p className="font-bold">{grant.studentName ?? "Student not linked yet"} <span className="font-mono font-normal">({grant.universityId})</span></p>
              <p className="text-xs text-muted-foreground">Granted by {grant.grantedByName ?? "Former staff"} · {formatCairoDate(grant.createdAt)}</p></div>
            <Button type="button" variant="outline" onClick={() => setRevoke(grant)}>Revoke</Button>
          </div>)}</div>}
      </div>
    </CardContent>
    <AlertDialog isOpen={!!revoke} onClose={() => setRevoke(null)} onConfirm={confirmRevoke}
      variant="destructive" title={`Revoke admin access for ${revoke?.universityId}?`}
      description="This removes admin access on the student's next request. Their student area remains available."
      confirmText={busy ? "Revoking…" : "Revoke access"} cancelText="Cancel" />
  </Card>;
}
