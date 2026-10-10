# SU Card email delivery

Transactional messages are queued in PostgreSQL. Microsoft Graph sends them from `su@nu.edu.eg` after a super admin connects that account. A Power Automate flow can still consume the same outbox if Graph is disconnected.

## Primary: Microsoft Graph delegated mail

1. Configure `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, and `MICROSOFT_CLIENT_SECRET` for the existing Entra app. Grant delegated `Mail.Send`, `offline_access`, and `User.Read` permissions. Register `/api/admin/mailer/microsoft/callback` on each app origin as a Web redirect URI.
2. Generate 32 random bytes, encode them as base64, and set `MAILER_TOKEN_KEY` on the app server. Set `MAILER_FROM` if the sender differs from `su@nu.edu.eg`. Keep the key stable: changing it makes the stored refresh token unreadable and requires reconnection.
3. Sign in as a super admin, open **Admin → Settings → Mail sender**, and select **Connect**. At Microsoft sign-in, choose `su@nu.edu.eg`. The app verifies the signed-in Microsoft account before storing its encrypted refresh token.
4. Send a password reset and check the queue count in Settings. Sending starts after enqueue; the daily `/api/cron/mailer` job also drains messages still due. The cron requires `Authorization: Bearer <CRON_SECRET>`.

If Microsoft requires admin approval, ask the Microsoft 365 administrator to grant the app's delegated permissions, then reconnect. If the sign-in expires, Settings shows a disconnected reason; reconnect there. Without `MAILER_TOKEN_KEY`, Graph sending is disabled and queued messages remain available to the fallback.

## Fallback: Power Automate

Set `MAILER_FEED_KEY` to a unique random value of at least 32 characters on the app and in the flow. Use a scheduled cloud flow under the SU Microsoft account. Avoid concurrent flow runs.

1. GET `https://YOUR-APP/api/mailer/feed` with header `Authorization: Bearer <MAILER_FEED_KEY>`. The response is RSS 2.0 with `Cache-Control: no-store`. Each item has a `guid` (outbox ID), `su:lease` (lease ID), `title` (subject), `description` (HTML inside CDATA), and `author` (recipient).
2. For each item, send an HTML email from `su@nu.edu.eg` to `author`, with the subject and body from the feed item.
3. After each successful send, POST `https://YOUR-APP/api/mailer/ack` with the same Authorization header and `Content-Type: application/json`:

   ```json
   {"items":[{"id":"THE-GUID","leaseId":"THE-SU-LEASE","outcome":"sent"}]}
   ```

   If the send fails, acknowledge with `"outcome":"failed"`. A failed item is due for retry after five minutes. The ack response reports whether each ID and lease was acknowledged.

The feed and Graph sender share the same leases, so a message is claimed by one path at a time. A successful send followed by a lost acknowledgement can still be retried; use the `guid` as an idempotency key if the flow supports one.
