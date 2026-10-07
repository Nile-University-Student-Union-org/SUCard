// Shared JSON contract for the admin vendor pages and cashier scanner. ISO dates use Cairo rules on the server.
export type VendorCategory = "food" | "coffee" | "fitness" | "books" | "services" | "other";
export type VendorStatus = "active" | "paused" | "ended";
export type OfferPeriod = "day" | "week" | "month" | "semester" | "total" | "unlimited";
export type ScanResultCode = "valid" | "invalid_qr" | "not_su_card" | "card_not_activated" | "card_cancelled" | "student_suspended" | "vendor_inactive" | "no_active_offer" | "limit_reached";
export type VendorDto = { id: string; name: string; category: VendorCategory; contactName: string | null; contactPhone: string | null; contactEmail: string | null; location: string | null; contractStart: string | null; contractEnd: string | null; status: VendorStatus; notes: string | null; logoUrl: string | null; createdAt: string; updatedAt: string };
export type BranchDto = { id: string; vendorId: string; name: string; address: string; lat: number | null; lng: number | null; status: "active" | "inactive" };
export type OfferDto = { id: string; vendorId: string; title: string; description: string | null; discountType: "percent" | "fixed" | "free_item" | "custom"; discountValue: string | null; discountText: string | null; terms: string | null; startsAt: string | null; endsAt: string | null; activeDays: number[]; activeFrom: string | null; activeTo: string | null; visible: boolean; limitCount: number | null; limitPeriod: OfferPeriod; status: "active" | "paused"; createdAt: string; updatedAt: string };
export type ScanOffer = { id: string; title: string; discountLabel: string; remainingUses: number | null; resetsAt: string | null };
export type ValidateRequest = { qr: string };
export type ValidateResponse = { scanId: string; result: ScanResultCode; reason: string | null; student: { name: string; universityId: string } | null; offers: ScanOffer[]; resetsAt: string | null };
export type ConfirmRequest = { scanId: string; offerId: string; billAmount?: number };
export type ConfirmResponse = { scanId: string; offerId: string; confirmedAt: string; billAmount: string | null; remainingUses: number | null; resetsAt: string | null };
export type TodayResponse = { count: number; totalBill: string; redemptions: { id: string; studentName: string; universityId: string; offerTitle: string; billAmount: string | null; confirmedAt: string }[] };
export type ScanContextResponse = { cashierName: string; vendorName: string; vendorLogoUrl: string | null; branchName: string; vendorActive: boolean };
export type VendorAccountDto = { id: string; email: string; name: string; role: "cashier" | "vendor_manager"; vendorId: string; branchId: string | null; status: "active" | "disabled" };
export type CreateVendorRequest = Omit<VendorDto, "id" | "logoUrl" | "createdAt" | "updatedAt">;
export type UpdateVendorRequest = Partial<CreateVendorRequest>;
export type CreateBranchRequest = Omit<BranchDto, "id" | "vendorId">;
export type UpdateBranchRequest = Partial<CreateBranchRequest>;
export type CreateOfferRequest = Omit<OfferDto, "id" | "vendorId" | "createdAt" | "updatedAt">;
export type UpdateOfferRequest = Partial<CreateOfferRequest>;
export type CreateVendorAccountRequest = { email: string; name: string; password: string; role: "cashier" | "vendor_manager"; branchId?: string | null };
export type UpdateVendorAccountRequest = { name?: string; branchId?: string | null; status?: "active" | "disabled" };
export type ResetVendorPasswordRequest = { password: string };
export type RedemptionDto = { id: string; createdAt: string; result: ScanResultCode | "rate_limited"; reason: string | null; confirmed: boolean; confirmedAt: string | null; billAmount: string | null; voided: boolean; voidReason: string | null; studentName: string | null; universityId: string | null; vendorName: string; branchName: string; cashierName: string; offerTitle: string | null };
export type RedemptionsResponse = { redemptions: RedemptionDto[]; nextCursor: string | null };
export type VoidRedemptionRequest = { reason: string };
export type OfferRevisionDto = { id: string; version: number; snapshot: OfferDto; changedBy: string | null; changedAt: string };
// Admin vendor, branch, offer, account and ledger endpoints return these wrappers.
export type ListVendorsResponse = { vendors: VendorDto[] };
export type VendorResponse = { vendor: VendorDto };
export type ListBranchesResponse = { branches: BranchDto[] };
export type BranchResponse = { branch: BranchDto };
export type ListOffersResponse = { offers: OfferDto[] };
export type OfferResponse = { offer: OfferDto };
export type OfferRevisionsResponse = { revisions: OfferRevisionDto[] };
export type ListVendorAccountsResponse = { accounts: VendorAccountDto[] };
export type VendorAccountResponse = { account: VendorAccountDto };
export type VoidRedemptionResponse = { id: string; voided: true; voidedAt: string; voidReason: string };
export type VendorApiError = { error: string; code?: ScanResultCode | string };
// POST logo: multipart/form-data with one `file` (PNG/JPEG/WebP <= 512 KiB) -> VendorResponse.
// GET logo: image bytes, ETag; conditional requests return 304. Password reset returns 204.

export function formatDiscount(offer: Pick<OfferDto, "discountType" | "discountValue" | "discountText">): string {
  if (offer.discountType === "custom" || offer.discountType === "free_item") return offer.discountText || (offer.discountType === "free_item" ? "Free item" : "Special offer");
  if (offer.discountValue === null) return "Discount";
  const value = Number(offer.discountValue).toString();
  return offer.discountType === "percent" ? `${value}% off` : `EGP ${value} off`;
}
