"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleChip } from "@/components/ui/toggle-chip";
import { CountBadge } from "@/components/ui/count-badge";
import { OverflowScroller } from "@/components/ui/overflow-scroller";
import { PageHeader } from "@/components/ui/page-header";
import { listVendors } from "./api";
import { VendorsTable } from "./vendors-table";
import { AddVendorModal } from "./add-vendor-modal";
import type { VendorDto, VendorStatus } from "@/lib/vendors/types";

type StatusFilter = "all" | VendorStatus;

export function VendorsManager() {
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchVendorsList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listVendors();
      setVendors(data.vendors || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vendors"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    listVendors()
      .then((data) => {
        if (active) {
          setVendors(data.vendors || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load vendors"
          );
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleVendorCreated = (newVendor: VendorDto) => {
    setVendors((prev) => [newVendor, ...prev]);
  };

  // Status counts
  const counts = useMemo(() => {
    const active = vendors.filter((v) => v.status === "active").length;
    const paused = vendors.filter((v) => v.status === "paused").length;
    const ended = vendors.filter((v) => v.status === "ended").length;
    return { all: vendors.length, active, paused, ended };
  }, [vendors]);

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      // Status filter
      if (statusFilter !== "all" && v.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = v.name.toLowerCase().includes(query);
        const matchesCategory = v.category.toLowerCase().includes(query);
        const matchesContact = v.contactName?.toLowerCase().includes(query) ?? false;
        const matchesEmail = v.contactEmail?.toLowerCase().includes(query) ?? false;
        const matchesLocation = v.location?.toLowerCase().includes(query) ?? false;
        return matchesName || matchesCategory || matchesContact || matchesEmail || matchesLocation;
      }

      return true;
    });
  }, [vendors, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <PageHeader
        title="PARTNER VENDORS"
        description="Manage stores, discounts, and staff scanner accounts."
        actions={
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="normal-case font-bold h-11 px-5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="size-4 mr-2 stroke-[2.5]" />
            <span>Add vendor</span>
          </Button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by vendor name, category, contact…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9.5 h-11 rounded-xl bg-card border-border text-sm"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="w-full md:w-auto">
          <OverflowScroller className="max-w-full">
            <ToggleChip
              pressed={statusFilter === "all"}
              onPressedChange={() => setStatusFilter("all")}
            >
              <span>All</span>
              <CountBadge count={counts.all} singularLabel="vendor" pluralLabel="vendors" />
            </ToggleChip>

            <ToggleChip
              pressed={statusFilter === "active"}
              onPressedChange={() => setStatusFilter("active")}
            >
              <span>Active</span>
              <CountBadge count={counts.active} singularLabel="vendor" pluralLabel="vendors" />
            </ToggleChip>

            <ToggleChip
              pressed={statusFilter === "paused"}
              onPressedChange={() => setStatusFilter("paused")}
            >
              <span>Paused</span>
              <CountBadge count={counts.paused} singularLabel="vendor" pluralLabel="vendors" />
            </ToggleChip>

            <ToggleChip
              pressed={statusFilter === "ended"}
              onPressedChange={() => setStatusFilter("ended")}
            >
              <span>Ended</span>
              <CountBadge count={counts.ended} singularLabel="vendor" pluralLabel="vendors" />
            </ToggleChip>
          </OverflowScroller>
        </div>
      </div>

      {/* Vendors Table / Cards View */}
      <VendorsTable
        vendors={filteredVendors}
        isLoading={isLoading}
        error={error}
        onRetry={fetchVendorsList}
        onAddNew={() => setIsAddModalOpen(true)}
      />

      {/* Add Vendor Modal */}
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onVendorCreated={handleVendorCreated}
      />
    </div>
  );
}
