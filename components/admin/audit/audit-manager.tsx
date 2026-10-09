"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowDown } from "lucide-react";
import type { AuditEntry, StaffMember } from "@/lib/staff/types";
import { AUDIT_PAGE_SIZE_DEFAULT } from "@/lib/staff/types";
import { type StaffUser } from "@/lib/auth/guards";
import { listAudit } from "./api";
import { listStaff } from "../staff/api";
import { AuditFilterBar } from "./audit-filter-bar";
import { AuditTimeline } from "./audit-timeline";
import { AuditDetailModal } from "./audit-detail-modal";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

interface AuditManagerProps {
  currentUser?: StaffUser;
}

export function AuditManager({}: AuditManagerProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const actionParam = searchParams.get("action") || "";
  const actorIdParam = searchParams.get("actorId") || "";

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const requestGeneration = useRef(0);
  const loadingMoreRef = useRef(false);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // Sync state with URL params
  const updateUrlParams = useCallback(
    (newAction: string, newActorId: string) => {
      // Invalidate pagination immediately, before the URL transition commits.
      requestGeneration.current += 1;
      const params = new URLSearchParams(searchParams.toString());
      if (newAction) {
        params.set("action", newAction);
      } else {
        params.delete("action");
      }

      if (newActorId) {
        params.set("actorId", newActorId);
      } else {
        params.delete("actorId");
      }

      params.delete("cursor"); // Reset cursor on filter change

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // Fetch staff list for actor filter
  useEffect(() => {
    let active = true;
    listStaff()
      .then((res) => {
        if (active) setStaffList(res.staff || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Fetch initial audit entries on filter change
  const fetchEntries = useCallback(async () => {
    const generation = ++requestGeneration.current;
    loadingMoreRef.current = false;
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
    setLoadMoreError(null);
    setEntries([]);
    setNextCursor(null);
    try {
      const data = await listAudit({
        action: actionParam || undefined,
        actorId: actorIdParam || undefined,
        limit: AUDIT_PAGE_SIZE_DEFAULT,
      });
      if (generation !== requestGeneration.current) return;
      setEntries(data.entries || []);
      setNextCursor(data.nextCursor);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load audit logs. Please try again.";
      if (generation === requestGeneration.current) setError(message);
    } finally {
      if (generation === requestGeneration.current) setIsLoading(false);
    }
  }, [actionParam, actorIdParam]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void fetchEntries();
    });
    return () => {
      active = false;
      requestGeneration.current += 1;
      loadingMoreRef.current = false;
    };
  }, [fetchEntries]);

  // Load more entries (cursor pagination)
  const handleLoadMore = async () => {
    if (!nextCursor || loadingMoreRef.current) return;
    const generation = requestGeneration.current;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const data = await listAudit({
        action: actionParam || undefined,
        actorId: actorIdParam || undefined,
        cursor: nextCursor,
        limit: AUDIT_PAGE_SIZE_DEFAULT,
      });
      if (generation !== requestGeneration.current) return;
      setEntries((prev) => [...prev, ...(data.entries || [])]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load more entries.";
      if (generation === requestGeneration.current) setLoadMoreError(message);
    } finally {
      if (generation === requestGeneration.current) {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <PageHeader
        title="AUDIT LOG"
        description="Track sensitive administrative operations and security events."
      />

      {/* Filter Bar */}
      <AuditFilterBar
        actionFilter={actionParam}
        actorFilter={actorIdParam}
        staffList={staffList}
        onActionChange={(action) => updateUrlParams(action, actorIdParam)}
        onActorChange={(actorId) => updateUrlParams(actionParam, actorId)}
        onClearFilters={() => updateUrlParams("", "")}
      />

      {/* Timeline List */}
      <AuditTimeline
        entries={entries}
        isLoading={isLoading}
        error={error}
        onRetry={fetchEntries}
        onSelectEntry={(entry) => setSelectedEntry(entry)}
      />

      {loadMoreError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
          <p className="min-w-0 break-words">Older events could not load. {loadMoreError}</p>
          <Button variant="outline" size="sm" onClick={handleLoadMore} className="min-h-11 normal-case">
            Try loading older events again
          </Button>
        </div>
      )}

      {/* Pagination Load More */}
      {nextCursor && !isLoading && !loadMoreError && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="md"
            onClick={handleLoadMore}
            loading={isLoadingMore}
            loadingText="Loading more events…"
            className="normal-case font-bold min-h-[44px] px-6"
          >
            <ArrowDown className="size-4 mr-2" />
            Load older events
          </Button>
        </div>
      )}

      {/* Event Detail Modal */}
      <AuditDetailModal
        entry={selectedEntry}
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}
