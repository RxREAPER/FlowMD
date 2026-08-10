# FlowMD Firestore Backups — Setup & Restore Runbook

## What this is

A nightly managed export of the `flowmd-04` Firestore database into a
Cloud Storage bucket (`gs://flowmd-04-backups`). Managed exports are the
official Firestore backup mechanism — restores are performed by Google Cloud,
not by importing files manually.

## One-time setup

```bash
# 1. Create the backup bucket (US-Central1 to match the Firestore region)
gcloud storage buckets create gs://flowmd-04-backups \
  --location=us-central1 --uniform-bucket-level-access

# 2. Pub/Sub topic that the Cloud Function listens on
gcloud pubsub topics create firestore-export

# 3. Deploy the export function (from this directory)
cd backup/functions && npm install
gcloud functions deploy scheduledFirestoreExport \
  --runtime nodejs20 \
  --trigger-topic firestore-export \
  --source backup/functions \
  --project flowmd-04

# 4. Nightly schedule (03:00 UTC)
gcloud scheduler jobs create pubsub firestore-export-daily \
  --schedule "0 3 * * *" \
  --topic firestore-export \
  --message-body "export" \
  --time-zone "UTC" \
  --project flowmd-04
```

## Verify it works

```bash
# Manually trigger the scheduler job once
gcloud scheduler jobs run firestore-export-daily --project flowmd-04

# Watch the export operation complete
gcloud firestore operations list --project flowmd-04

# Check the bucket for a timestamped export folder
gsutil ls gs://flowmd-04-backups/
```

## Restoring user data

> Restoring an export **overwrites the live database**. Only restore when
> you intend to roll back user data (e.g., a bad deploy wiped documents).
> Consider restoring to a *different* project first and copying only the
> documents you need.

```bash
# 1. List available exports (note the full outputUriPrefix of the one to restore)
gcloud firestore operations list --project flowmd-04

# 2. Restore a specific export
gcloud firestore import gs://flowmd-04-backups/<stamp>/ \
  --project flowmd-04

# 3. Verify user document counts match expectations
#    (via the Firebase console or the rules-test emulator seed)
```

## How long exports are kept

Nothing deletes old exports automatically. `gsutil lifecycle` can be added to
the bucket to expire exports older than N days, e.g.:

```bash
echo '{"lifecycle":{"rule":[{"action":{"type":"Delete"},"condition":{"age":90}}]}}' \
  > /tmp/lifecycle.json
gsutil lifecycle set /tmp/lifecycle.json gs://flowmd-04-backups
```

## Who can access the bucket

By default only project owners/editors. No public access (uniform bucket-level
access is enabled at creation).
