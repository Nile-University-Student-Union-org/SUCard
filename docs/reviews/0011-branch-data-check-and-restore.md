# Migration 0011 branch data check and restore

Migration `0011_exotic_vivisector.sql` removes `branches`, `user.branch_id`, and `scan_events.branch_id`. It has already run in development. Do not edit or replay it against a database that records it as applied.

## Check before applying 0011 to another database

Run these read-only queries on that database and retain the counts and a backup identifier with the deployment record:

```sql
SELECT count(*) AS branches FROM branches;
SELECT count(*) AS users_with_branch FROM "user" WHERE branch_id IS NOT NULL;
SELECT count(*) AS scans_with_branch FROM scan_events WHERE branch_id IS NOT NULL;
SELECT b.id, b.name, count(DISTINCT u.id) AS users, count(DISTINCT s.id) AS scans
FROM branches b
LEFT JOIN "user" u ON u.branch_id = b.id
LEFT JOIN scan_events s ON s.branch_id = b.id
GROUP BY b.id, b.name ORDER BY b.id;
```

If any counts are nonzero, decide where that history must live and export it before applying 0011. Capture `branches`, `(user.id, user.branch_id)`, and `(scan_events.id, scan_events.branch_id)` in a protected backup. The migration does not preserve these relationships.

## Restore after 0011

Restore a point-in-time backup from just before 0011 into a **separate** PostgreSQL database. Verify the three counts above there, then export the three datasets. Reconcile identifiers against the live database and import the mappings into dedicated archive tables or the approved replacement model. Do not restore the old schema directly over the live database: later migrations and writes may already exist. If a full database rollback is required, restore the entire backup to a separate instance, validate it, and plan replay of later changes before cutover. Without a pre-0011 backup or export, the dropped branch relationships cannot be reconstructed reliably.

After applying elsewhere, verify that `branches` and both `branch_id` columns are absent and that the migration journal records 0011 exactly once. This check does not require production writes.
