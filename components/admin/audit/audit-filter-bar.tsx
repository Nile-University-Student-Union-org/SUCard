"use client";

import React from "react";
import { AUDIT_ACTIONS, type StaffMember } from "@/lib/staff/types";
import { Dropdown } from "@/components/ui/dropdown";
import { ActiveFilterChips, type ActiveFilterItem } from "@/components/ui/active-filter-chips";

interface AuditFilterBarProps {
  actionFilter: string;
  actorFilter: string;
  staffList: StaffMember[];
  onActionChange: (action: string) => void;
  onActorChange: (actorId: string) => void;
  onClearFilters: () => void;
}

export function AuditFilterBar({
  actionFilter,
  actorFilter,
  staffList,
  onActionChange,
  onActorChange,
  onClearFilters,
}: AuditFilterBarProps) {
  const actionOptions = [
    { value: "", label: "All actions" },
    ...Object.entries(AUDIT_ACTIONS).map(([key, label]) => ({
      value: key,
      label: `${label} (${key})`,
    })),
  ];

  const actorOptions = [
    { value: "", label: "All staff actors" },
    ...staffList.map((staff) => ({
      value: staff.id,
      label: `${staff.name} (${staff.email})`,
    })),
  ];

  // Active filter items for chips
  const activeChips: ActiveFilterItem[] = [];

  if (actionFilter) {
    const actionLabel = AUDIT_ACTIONS[actionFilter as keyof typeof AUDIT_ACTIONS] || actionFilter;
    activeChips.push({
      id: "action",
      label: `Action: ${actionLabel}`,
      onRemove: () => onActionChange(""),
    });
  }

  if (actorFilter) {
    const actor = staffList.find((s) => s.id === actorFilter);
    const actorLabel = actor ? actor.name : actorFilter;
    activeChips.push({
      id: "actor",
      label: `Actor: ${actorLabel}`,
      onRemove: () => onActorChange(""),
    });
  }

  return (
    <div className="space-y-3">
      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Action Dropdown */}
        <Dropdown
          label="Filter by Action"
          placeholder="All actions"
          searchable
          searchPlaceholder="Search actions…"
          value={actionFilter}
          onChange={(val) => onActionChange(String(val))}
          options={actionOptions}
        />

        {/* Actor Dropdown */}
        <Dropdown
          label="Filter by Staff Actor"
          placeholder="All staff actors"
          searchable
          searchPlaceholder="Search staff…"
          value={actorFilter}
          onChange={(val) => onActorChange(String(val))}
          options={actorOptions}
        />
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <ActiveFilterChips
          filters={activeChips}
          onClearAll={onClearFilters}
        />
      )}
    </div>
  );
}
