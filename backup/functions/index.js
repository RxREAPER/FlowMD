// FlowMD — scheduled Firestore export.
// Triggered nightly by Cloud Scheduler -> Pub/Sub topic `firestore-export`.
// Writes a full managed export of the `flowmd-04` Firestore database to the
// `gs://flowmd-04-backups` bucket under a timestamped prefix.
const { Firestore } = require('@google-cloud/firestore');

exports.scheduledFirestoreExport = async (event, context) => {
  const firestore = new Firestore();
  const bucket = 'gs://flowmd-04-backups';
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  try {
    // Ensure the SDK is initialized before starting the export.
    await firestore.bulkWriter().flush();
    const res = await firestore.exportDocuments({ outputUriPrefix: `${bucket}/${stamp}/` });
    console.log('Export started:', res);
  } catch (e) {
    console.error('Export failed:', e);
    throw e; // Pub/Sub retries on failure
  }
};
