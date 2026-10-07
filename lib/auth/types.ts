/** UI contract for Better Auth JSON endpoints (prefix every path with /api/auth). */
export type EmailSignIn = { email: string; password: string; rememberMe?: boolean };
/** POST /sign-in/email: when enrolled, response is { twoFactorRedirect: true }; show the code step. */
export type TwoFactorCode = { code: string; trustDevice?: boolean };
/** POST /two-factor/verify-totp with TwoFactorCode; POST /two-factor/verify-backup-code with TwoFactorCode.
 * trustDevice=true remembers this browser for 30 days. Backup codes are single-use. */
export type TwoFactorEnable = { password: string; method?: "totp"; issuer?: "SU Card" };
/** POST /two-factor/enable with TwoFactorEnable while signed in on /admin-2fa/setup.
 * Response: { method: "totp", totpURI: string, backupCodes: string[] }.
 * Show and ask the admin to save backup codes, then POST /two-factor/verify-totp { code } to activate.
 * POST /two-factor/generate-backup-codes { password } replaces all prior codes.
 * POST /two-factor/disable { password } disables own 2FA. Super admin reset is POST /api/admin/staff/[id]/reset-2fa.
 */
export type PasswordResetRequest = { email: string; redirectTo?: string };
/** POST /request-password-reset with PasswordResetRequest; always show generic success text.
 * Email links to /reset-password?token=...; POST /reset-password { token, newPassword }.
 * Reset revokes all sessions. */
export type PasswordReset = { token: string; newPassword: string };
/** Account creation: POST /api/admin/staff, /api/admin/vendors/[id]/accounts, or /api/vendor/cashiers
 * queues a one-time set-password link. Existing password fields are accepted for compatibility but ignored. */
