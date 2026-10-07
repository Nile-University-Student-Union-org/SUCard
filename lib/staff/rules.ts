import type { StaffRole, StaffStatus, UpdateStaffRequest } from "./types";

export function wouldRemoveLastSuperAdmin(
  staff: { id: string; role: StaffRole; status: StaffStatus }[],
  targetId: string,
  patch: UpdateStaffRequest,
): boolean {
  const target = staff.find((member) => member.id === targetId);
  if (!target || target.role !== "super_admin" || target.status !== "active") return false;
  if ((patch.role ?? target.role) === "super_admin" && (patch.status ?? target.status) === "active") return false;
  return staff.filter((member) => member.role === "super_admin" && member.status === "active").length === 1;
}
