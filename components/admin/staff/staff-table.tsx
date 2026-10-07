"use client";

import React from "react";
import {
  Users,
  RotateCcw,
  AlertTriangle,
  MoreVertical,
  UserCog,
  KeyRound,
  UserX,
  UserCheck,
  Calendar,
  Clock,
} from "lucide-react";
import type { StaffMember } from "@/lib/staff/types";
import { formatCairoDate, formatRelativeTime } from "./utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusState } from "@/components/ui/status-state";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "cn";

interface StaffTableProps {
  staff: StaffMember[];
  currentUserId?: string;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (member: StaffMember) => void;
  onToggleStatus: (member: StaffMember) => void;
  onResetPassword: (member: StaffMember) => void;
}

export function StaffTable({
  staff,
  currentUserId,
  isLoading,
  error,
  onRetry,
  onEdit,
  onToggleStatus,
  onResetPassword,
}: StaffTableProps) {
  return (
    <Card className="border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <CardTitle className="text-xl sm:text-2xl text-foreground">
            ADMIN ACCOUNTS
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Personnel authorized to access and operate the SU Card admin console.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand" className="text-xs font-bold">
            {staff.length} {staff.length === 1 ? "Member" : "Members"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Error State */}
        {error ? (
          <div className="p-8">
            <StatusState
              layout="panel"
              variant="destructive"
              icon={<AlertTriangle className="size-6 text-rose-600 dark:text-rose-400" />}
              title="Failed to load staff accounts"
              description={error}
              actions={
                <Button variant="outline" size="sm" onClick={onRetry} className="normal-case">
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Try again
                </Button>
              }
            />
          </div>
        ) : isLoading ? (
          /* Loading Skeletons */
          <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading staff list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 p-3 border-b border-slate-100 dark:border-zinc-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" className="size-9" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        ) : staff.length === 0 ? (
          /* Empty State */
          <div className="p-8">
            <StatusState
              layout="panel"
              icon={<Users className="size-7 text-muted-foreground" />}
              title="No staff members found"
              description="Click 'Add staff' above to create the first admin account."
            />
          </div>
        ) : (
          <>
            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-56">Staff Member</TableHead>
                    <TableHead className="min-w-32">Role</TableHead>
                    <TableHead className="min-w-28">Status</TableHead>
                    <TableHead className="min-w-36">Last Sign In</TableHead>
                    <TableHead className="min-w-36">Added Date</TableHead>
                    <TableHead className="w-24 text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => {
                    const isSelf = Boolean(member.isSelf || (currentUserId && member.id === currentUserId));
                    const isSuperAdmin = member.role === "super_admin";
                    const isActive = member.status === "active";

                    return (
                      <TableRow
                        key={member.id}
                        className={cn(
                          "transition-colors",
                          !isActive && "opacity-60 bg-slate-50/40 dark:bg-zinc-900/40"
                        )}
                      >
                        {/* Name + Email + Avatar */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={member.name} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-charcoal dark:text-white truncate">
                                  {member.name}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-soft border border-brand/25">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-ash dark:text-zinc-400 truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role Badge */}
                        <TableCell className="py-3.5">
                          <Badge
                            variant={isSuperAdmin ? "brand" : "outline"}
                            className="text-[10px] font-bold uppercase tracking-wider"
                          >
                            {isSuperAdmin ? "Super Admin" : "Admin"}
                          </Badge>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="py-3.5">
                          <Badge
                            variant={isActive ? "success" : "destructive"}
                            className="text-[10px] font-bold uppercase tracking-wider"
                          >
                            {isActive ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>

                        {/* Last Sign In (relative + exact on title) */}
                        <TableCell className="text-xs text-ash dark:text-zinc-400 py-3.5 whitespace-nowrap">
                          <div
                            className="flex items-center gap-1.5 text-[11px] cursor-help"
                            title={member.lastLoginAt ? formatCairoDate(member.lastLoginAt) : "Never logged in"}
                          >
                            <Clock className="size-3 text-ash dark:text-zinc-400 shrink-0" />
                            <span>{formatRelativeTime(member.lastLoginAt)}</span>
                          </div>
                        </TableCell>

                        {/* Added Date */}
                        <TableCell className="text-xs text-ash dark:text-zinc-400 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="size-3 text-ash dark:text-zinc-400 shrink-0" />
                            <span>{formatCairoDate(member.createdAt)}</span>
                          </div>
                        </TableCell>

                        {/* Actions Menu */}
                        <TableCell className="text-right py-3.5 pr-4 whitespace-nowrap">
                          {isSelf ? (
                            <span className="text-[11px] font-bold text-ash dark:text-zinc-500 italic pr-2">
                              Your account
                            </span>
                          ) : (
                            <Dropdown align="right">
                              <DropdownTrigger
                                ariaLabel={`Actions for ${member.name}`}
                                className="h-8 w-8 rounded-lg items-center justify-center border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                              >
                                <MoreVertical className="size-4 text-ash dark:text-zinc-400" />
                              </DropdownTrigger>
                              <DropdownContent className="w-48">
                                <DropdownItem
                                  onClick={() => onEdit(member)}
                                >
                                  <UserCog className="size-4 mr-2 text-ash dark:text-zinc-400" />
                                  <span>Edit details</span>
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() => onResetPassword(member)}
                                >
                                  <KeyRound className="size-4 mr-2 text-ash dark:text-zinc-400" />
                                  <span>Reset password</span>
                                </DropdownItem>
                                <DropdownSeparator />
                                <DropdownItem
                                  onClick={() => onToggleStatus(member)}
                                  className={isActive ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}
                                >
                                  {isActive ? (
                                    <>
                                      <UserX className="size-4 mr-2 text-rose-600 dark:text-rose-400" />
                                      <span>Disable account</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="size-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                                      <span>Enable account</span>
                                    </>
                                  )}
                                </DropdownItem>
                              </DropdownContent>
                            </Dropdown>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards List (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-800 p-3 space-y-3">
              {staff.map((member) => {
                const isSelf = Boolean(member.isSelf || (currentUserId && member.id === currentUserId));
                const isSuperAdmin = member.role === "super_admin";
                const isActive = member.status === "active";

                return (
                  <div
                    key={member.id}
                    className={cn(
                      "p-3.5 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3",
                      !isActive && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={member.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-charcoal dark:text-white truncate">
                              {member.name}
                            </span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-brand/10 text-brand dark:text-brand-soft border border-brand/25">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ash dark:text-zinc-400 truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={isSuperAdmin ? "brand" : "outline"}
                          className="text-[9px] font-bold uppercase"
                        >
                          {isSuperAdmin ? "Super" : "Admin"}
                        </Badge>
                        <Badge
                          variant={isActive ? "success" : "destructive"}
                          className="text-[9px] font-bold uppercase"
                        >
                          {isActive ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ash dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 text-ash dark:text-zinc-400" />
                        <span>Last login: {formatRelativeTime(member.lastLoginAt)}</span>
                      </div>
                      <span>{formatCairoDate(member.createdAt)}</span>
                    </div>

                    {!isSelf && (
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(member)}
                          className="min-h-[44px] text-xs font-bold normal-case"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResetPassword(member)}
                          className="min-h-[44px] text-xs font-bold normal-case"
                        >
                          Password
                        </Button>
                        <Button
                          variant={isActive ? "destructive" : "primary"}
                          size="sm"
                          onClick={() => onToggleStatus(member)}
                          className="min-h-[44px] text-xs font-bold normal-case"
                        >
                          {isActive ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
