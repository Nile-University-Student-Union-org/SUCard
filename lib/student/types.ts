// JSON contract shared by the student and admin frontends. Dates are ISO strings.
export const UNIVERSITY_ID_REGEX = /^\d{9}$/;
export type CardFlow = "digital" | "physical";
export type StudentStatus = "active" | "suspended";
export type ClaimErrorCode = "not_su_card" | "already_linked" | "cancelled" | "already_has_card" | "rate_limited" | "invalid_qr";
export type Area = { key: "student" | "admin" | "scanner" | "vendor"; label: string; href: string };
export type IssuanceSetting = { mode: CardFlow; physicalQuotaRemaining: number | null };
export type OfficeSchedule = {
  weekly: { day: number; open: string; close: string }[];
  exceptions: { date: string; closed: boolean; open?: string; close?: string; note?: string }[];
};
export type OfficeSetting = { location: string; schedule: OfficeSchedule };
export type Settings = { issuance: IssuanceSetting; allowDigitalUpgrade: boolean; emailOnSuspend: boolean; studentEmailPattern: string; office: OfficeSetting; semesters: { name: string; start: string; end: string }[]; atRisk: { redemptions: number; days: number } };
export type ApiError = { error: string; code?: ClaimErrorCode | string };
export type CardSummary = { id: string; type: CardFlow; serial: string; status: "unassigned" | "active" | "void"; qr: string; linkedAt: string | null };

// GET /api/me; POST /api/me/area {key}; GET /go redirects.
export type MeResponse = { name: string; email: string; areas: Area[]; studentStatus: "none" | "needs_profile" | StudentStatus; role: string };
export type SetAreaRequest = { key: Area["key"] };
export type SetAreaResponse = { href: string };

// POST /api/student/profile; GET /api/student/home; POST /api/student/card/claim.
export type CompleteProfileRequest = { universityId: string };
export type StudentProfile = { userId: string; universityId: string; cardFlow: CardFlow; status: StudentStatus; suspendReason: string | null; registeredAt: string };
export type StudentHomeResponse = { profile: StudentProfile; name: string; email: string; card: CardSummary | null; office: OfficeSetting; flow: CardFlow };
export type ClaimCardRequest = { qr: string };
export type ClaimCardResponse = { card: CardSummary };

// GET/PATCH /api/admin/settings.
export type SettingsResponse = { settings: Settings; stats: { pendingPhysicalStudents: number; unassignedCardsInStock: number; warning: boolean } };
export type UpdateSettingsRequest = Partial<Settings>;

// POST /api/admin/cards/{id}/void; POST /api/admin/batches/{id}/void.
export type VoidRequest = { reason: string };
export type VoidResponse = { count: number };
// GET /api/admin/cards/lookup?qr=...|serial=...
export type CardLookupResponse = { card: CardSummary & { batchLabel: string | null; student: { userId: string; name: string; email: string; universityId: string } | null } };
// GET /api/admin/students?q=&cursor=; PATCH /api/admin/students/{id}.
export type StudentSearchItem = { profile: StudentProfile; name: string; email: string; card: CardSummary | null; registeredAt?: string; lastRedemptionAt?: string | null };
export type StudentSearchResponse = { students: StudentSearchItem[]; nextCursor: string | null };
export type SetStudentFlowRequest = { cardFlow: CardFlow };
export type SetStudentFlowResponse = { student: StudentSearchItem };
// POST /api/admin/students/{id}/link-card; POST /api/admin/students/switch-pending-to-digital.
export type AdminLinkRequest = { qr: string; serial?: never } | { serial: string | number; qr?: never };
export type AdminLinkResponse = ClaimCardResponse;
export type BulkSwitchResponse = { count: number };
// POST /api/admin/staff/promote; POST /api/admin/staff/{id}/revoke.
export type PromoteStudentRequest = { email: string };
export type StaffRoleResponse = { id: string; role: string };

// GET /api/student/wallet/google — "Save to Google Wallet" link for the student's active card.
// Errors: 401 not signed in; 404 no student profile; 409 { code: "no_card" } no active card;
// 403 { code: "suspended" }; 503 { code: "wallet_unavailable" } Google Wallet not configured.
export type GoogleWalletSaveResponse = { saveUrl: string };
