import { acknowledgeEmail, claimEmail, releaseEmail } from "./delivery";
import { graphConnected, GraphDisconnectedError, sendGraphMail } from "./graph-sender";

export async function drainOutbox(limit = 20) {
  if (!await graphConnected()) return { sent: 0, failed: 0 };
  const claims = await claimEmail(limit);
  let sent = 0;
  let failed = 0;
  for (let index = 0; index < claims.length; index++) {
    const claim = claims[index];
    try {
      await sendGraphMail(claim);
      await acknowledgeEmail(claim.id, claim.leaseId!, "sent");
      sent++;
    } catch (error) {
      if (error instanceof GraphDisconnectedError) {
        for (const remaining of claims.slice(index)) await releaseEmail(remaining.id, remaining.leaseId!);
        break;
      }
      await acknowledgeEmail(claim.id, claim.leaseId!, "failed");
      failed++;
    }
  }
  return { sent, failed };
}
