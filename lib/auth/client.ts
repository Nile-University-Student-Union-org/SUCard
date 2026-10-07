"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

// Browser-side Better Auth client. Server config lives in lib/auth/server.ts.
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
});

export const { signIn, signOut, useSession, twoFactor } = authClient;
