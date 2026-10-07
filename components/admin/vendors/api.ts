import type {
  CreateVendorRequest,
  UpdateVendorRequest,
  CreateBranchRequest,
  UpdateBranchRequest,
  CreateOfferRequest,
  UpdateOfferRequest,
  CreateVendorAccountRequest,
  UpdateVendorAccountRequest,
  ListVendorsResponse,
  VendorResponse,
  ListBranchesResponse,
  BranchResponse,
  ListOffersResponse,
  OfferResponse,
  OfferRevisionsResponse,
  ListVendorAccountsResponse,
  VendorAccountResponse,
} from "@/lib/vendors/types";

export async function listVendors(): Promise<ListVendorsResponse> {
  const res = await fetch("/api/admin/vendors", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load vendors");
  }
  return res.json();
}

export async function getVendor(id: string): Promise<VendorResponse> {
  const res = await fetch(`/api/admin/vendors/${id}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load vendor");
  }
  return res.json();
}

export async function createVendor(
  payload: CreateVendorRequest
): Promise<VendorResponse> {
  const res = await fetch("/api/admin/vendors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to create vendor");
  }
  return data;
}

export async function updateVendor(
  id: string,
  payload: UpdateVendorRequest
): Promise<VendorResponse> {
  const res = await fetch(`/api/admin/vendors/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to update vendor");
  }
  return data;
}

export async function uploadVendorLogo(
  id: string,
  file: File
): Promise<VendorResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/admin/vendors/${id}/logo`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to upload vendor logo");
  }
  return data;
}

export async function listBranches(
  vendorId: string
): Promise<ListBranchesResponse> {
  const res = await fetch(`/api/admin/vendors/${vendorId}/branches`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load branches");
  }
  return res.json();
}

export async function createBranch(
  vendorId: string,
  payload: CreateBranchRequest
): Promise<BranchResponse> {
  const res = await fetch(`/api/admin/vendors/${vendorId}/branches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to create branch");
  }
  return data;
}

export async function updateBranch(
  branchId: string,
  payload: UpdateBranchRequest
): Promise<BranchResponse> {
  const res = await fetch(`/api/admin/branches/${branchId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to update branch");
  }
  return data;
}

export async function listOffers(
  vendorId: string
): Promise<ListOffersResponse> {
  const res = await fetch(`/api/admin/vendors/${vendorId}/offers`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load offers");
  }
  return res.json();
}

export async function getOffer(id: string): Promise<OfferResponse> {
  const res = await fetch(`/api/admin/offers/${id}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load offer");
  }
  return res.json();
}

export async function createOffer(
  vendorId: string,
  payload: CreateOfferRequest
): Promise<OfferResponse> {
  const res = await fetch(`/api/admin/vendors/${vendorId}/offers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to create offer");
  }
  return data;
}

export async function updateOffer(
  offerId: string,
  payload: UpdateOfferRequest
): Promise<OfferResponse> {
  const res = await fetch(`/api/admin/offers/${offerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to update offer");
  }
  return data;
}

export async function listOfferRevisions(
  offerId: string
): Promise<OfferRevisionsResponse> {
  const res = await fetch(`/api/admin/offers/${offerId}/revisions`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load revisions");
  }
  return res.json();
}

export async function listVendorAccounts(
  vendorId: string
): Promise<ListVendorAccountsResponse> {
  const res = await fetch(`/api/admin/vendors/${vendorId}/accounts`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load vendor accounts");
  }
  return res.json();
}

export async function createVendorAccount(
  vendorId: string,
  payload: CreateVendorAccountRequest
): Promise<VendorAccountResponse> {
  const res = await fetch(`/api/admin/vendors/${vendorId}/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to create vendor account");
  }
  return data;
}

export async function updateVendorAccount(
  accountId: string,
  payload: UpdateVendorAccountRequest
): Promise<VendorAccountResponse> {
  const res = await fetch(`/api/admin/vendor-accounts/${accountId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Failed to update vendor account");
  }
  return data;
}

export async function resetVendorAccountPassword(
  accountId: string,
  password: string
): Promise<void> {
  const res = await fetch(`/api/admin/vendor-accounts/${accountId}/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to reset password");
  }
}

export async function revokeVendorAccountSessions(accountId: string): Promise<void> {
  const res = await fetch(`/api/admin/vendor-accounts/${accountId}/revoke-sessions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to revoke sessions");
  }
}

