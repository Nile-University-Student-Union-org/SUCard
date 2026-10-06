"use client";

import { createAuthClient } from "better-auth/react";

// Browser-side Better Auth client. Server config lives in lib/auth/server.ts.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
