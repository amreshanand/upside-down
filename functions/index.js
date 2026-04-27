const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

const db = getFirestore();

// Trigger: When a new hazard is reported in 'zones', auto-create an alert
exports.onHazardReported = onDocumentCreated('zones/{zoneId}', async (event) => {
  const zone = event.data?.data();
  if (!zone) return;

  // Only trigger for hazard type
  if (zone.type !== 'hazard') return;

  const severityMap = {
    'Flooded Road': 'high',
    'Blocked Road': 'medium',
    'Open Shelter': 'low',
    'Medical Need': 'high',
  };

  // Parse hazard type from description
  const descParts = (zone.description || '').split(':');
  const hazardType = descParts[0].trim();
  const severity = severityMap[hazardType] || 'medium';

  const alert = {
    title: `${hazardType} Reported`,
    severity,
    message: zone.description || 'A new hazard has been reported by a citizen.',
    location: `${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)}`,
    timestamp: Date.now(),
  };

  try {
    await db.collection('alerts').add(alert);
    console.log(`Alert created for hazard: ${hazardType}`);
  } catch (err) {
    console.error('Failed to create alert:', err);
  }
});
