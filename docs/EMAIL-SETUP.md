# SU Card email delivery with Power Automate

SU Card queues transactional email in PostgreSQL. A Power Automate cloud flow sends it from `su@nu.edu.eg`. Set `PUBLIC_BASE_URL` to the public HTTPS app origin, and set `MAILER_FEED_KEY` to a unique random value of at least 32 characters on the app server. Keep the key only in server configuration and the flow.

1. In Power Automate, create a **Scheduled cloud flow** that runs every minute under the SU Microsoft account with permission to send as `su@nu.edu.eg`.
2. Add an HTTP GET step to `https://YOUR-APP/api/mailer/feed?key=YOUR_KEY`. The response is RSS 2.0 and has `Cache-Control: no-store`. Parse the RSS XML items. Each `guid` is the outbox UUID; `title` is the subject; `description` is HTML inside CDATA; `author` and `category` both contain the recipient email. Use `author` as the recipient.
3. For each item, use **Send an email (V2)** with **From** `su@nu.edu.eg`, **To** from `author`, **Subject** from `title`, and **Body** from the HTML `description`. Configure the action to treat the body as HTML.
4. Only after the send action succeeds, POST `https://YOUR-APP/api/mailer/ack` with JSON `{"key":"YOUR_KEY","ids":["THE-GUID"]}` and `Content-Type: application/json`. A successful ack responds with the IDs it marked sent. Leave failed sends unacknowledged so the next poll retries.
5. Test by requesting a password reset for a seeded account, checking that the item appears in the feed, sending it, acknowledging it, and confirming it disappears.

The flow can retry a sent message if delivery succeeds but acknowledgement fails. Configure the flow to avoid concurrent runs and use the `guid` as its idempotency key if the mail action supports it. Do not publish the feed URL or include it in client-side code.
