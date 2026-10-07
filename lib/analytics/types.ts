/** STEP 6 JSON contract. Dates are ISO instants unless named `day` (YYYY-MM-DD in Africa/Cairo).
 * All redemption counts include only confirmed, non-voided scans. Null student IDs from deletion
 * remain in redemption totals and are excluded from unique-student counts. Money is a decimal string.
 */
export type DateRange = { from: string; to: string; previousFrom: string; previousTo: string; days: number };
/** GET /api/admin/dashboard; /api/admin/vendors/[id]/stats; /api/vendor/overview and /api/vendor/export. */
export type RangeQuery = { from?: string; to?: string };
export type DashboardQuery = RangeQuery & { vendorId?: string; category?: string; offerId?: string; granularity?: "day" | "week" | "month" };
/** GET /api/admin/students and /api/admin/export/students; cursor applies only to JSON pagination. */
export type StudentSearchQuery = { q?: string; status?: "active" | "suspended"; signedUpFrom?: string; signedUpTo?: string; cursor?: string };
/** GET /api/student/deals and /api/student/history. */
export type DealsQuery = { q?: string; category?: string };
export type HistoryQuery = { cursor?: string };
export type CountComparison = { current: number; previous: number; changePercent: number | null };
export type TimePoint = { bucket: string; redemptions: number };
export type NamedCount = { id: string; name: string; redemptions: number };
export type PeakCount = { value: number; redemptions: number };
export type VendorLeader = { id: string; name: string; logoUrl: string | null; category: string; redemptions: number; uniqueStudents: number; previousRedemptions: number; changePercent: number | null };
export type DashboardResponse = { range: DateRange; granularity: "day" | "week" | "month"; kpis: {
  redemptions: CountComparison; uniqueStudents: CountComparison; activeVendors: number;
  cardsByType: { digital: number; physical: number }; physical: { printed: number; unassigned: number; activated: number };
  pendingPhysicalStudents: number;
  /** Save links issued. Google does not tell us whether the student tapped Save. */
  walletPassesIssued: number; cardholderRedemptionPercent: number;
}; timeseries: TimePoint[]; leaderboard: VendorLeader[]; atRisk: { id: string; name: string; redemptions: number; threshold: number; days: number }[] };
export type VendorStatsResponse = { range: DateRange; redemptions: CountComparison; uniqueStudents: CountComparison; totalBill: string; averageBill: string | null; timeseries: TimePoint[]; branches: NamedCount[]; offers: NamedCount[]; peakDays: PeakCount[]; peakHours: PeakCount[]; recent?: { id: string; studentName: string | null; universityId: string | null; branchName: string; offerTitle: string | null; billAmount: string | null; confirmedAt: string }[] };
export type VendorOverviewResponse = VendorStatsResponse & { vendor: { id: string; name: string; logoUrl: string | null; status: string } };
export type StudentDetailResponse = { id: string; name: string; email: string; profile: { universityId: string; cardFlow: string; status: string; suspendReason: string | null; registeredAt: string }; cards: { id: string; type: string; serial: string; status: string; linkedAt: string | null; voidedAt: string | null; voidReason: string | null }[]; walletPasses: { platform: string; objectId: string; firstIssuedAt: string; lastSyncedAt: string }[]; redemptions: { id: string; vendorName: string; branchName: string; offerTitle: string | null; confirmedAt: string; billAmount: string | null }[]; nextCursor: string | null };
/** PATCH /api/admin/students/[id]; POST suspend, reactivate, delete, and bulk. */
export type StudentPatchRequest = { name?: string; universityId?: string; cardFlow?: "digital" | "physical" };
export type SuspendRequest = { reason: string };
export type DeleteStudentRequest = { confirmEmail: string };
export type BulkStudentRequest = { action: "suspend" | "reactivate"; ids: string[]; reason?: string };
export type StudentActionResponse = { count: number };
export type DeleteStudentResponse = { deleted: true; emailHash: string };
export type StudentDeal = { vendorId: string; vendorName: string; logoUrl: string | null; category: string; location: string | null; offerId: string; title: string; discountLabel: string; terms: string | null; limitText: string; scheduleText: string; remainingUses: number | null; resetsAt: string | null };
export type StudentDealsResponse = { deals: StudentDeal[] };
export type StudentHistoryResponse = { redemptions: { id: string; vendorName: string; branchName: string; offerTitle: string | null; confirmedAt: string; billAmount: string | null }[]; nextCursor: string | null };
export type VendorOffersResponse = { offers: { id: string; title: string; discountLabel: string; terms: string | null; limitCount: number | null; limitPeriod: string; startsAt: string | null; endsAt: string | null; activeDays: number[]; activeFrom: string | null; activeTo: string | null; status: string }[] };
export type CashiersResponse = { cashiers: { id: string; email: string; name: string; branchId: string | null; branchName: string | null; status: "active" | "disabled" }[] };
/** POST /api/vendor/cashiers; PATCH /api/vendor/cashiers/[id]; POST its password route. */
export type CreateCashierRequest = { email: string; name: string; password: string; branchId: string };
export type UpdateCashierRequest = { name?: string; branchId?: string; status?: "active" | "disabled" };
export type CashierPasswordRequest = { password: string };
/** GET /api/admin/export/redemptions; /api/admin/export/vendors. */
export type RedemptionsExportQuery = RangeQuery & { vendorId?: string };
/** CSV routes return text/csv with UTF-8 BOM and Content-Disposition attachment; 100k data-row cap. */
export type CsvExport = Response;
