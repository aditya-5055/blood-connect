/**
 * Reusable utility to compute search radius based on request urgency levels
 * and calculate distance between coordinates.
 */

const BANK_RADIUS = {
  Critical: 10000,   // 10 km
  High: 20000,       // 20 km
  Moderate: 35000,   // 35 km
  Medium: 35000,     // Alias
  Normal: 50000,     // 50 km
  Low: 50000,        // Alias
};

const DONOR_RADIUS = {
  Critical: 5000,    // 5 km
  High: 10000,       // 10 km
  Moderate: 20000,   // 20 km
  Medium: 20000,     // Alias
  Normal: 30000,     // 30 km
  Low: 30000,        // Alias
};

/**
 * Get blood bank search radius in meters
 * @param {String} urgencyLevel 
 * @returns {Number} Radius in meters
 */
function getBloodBankRadius(urgencyLevel) {
  return BANK_RADIUS[urgencyLevel] || BANK_RADIUS.Normal;
}

/**
 * Get donor search radius in meters
 * @param {String} urgencyLevel 
 * @returns {Number} Radius in meters
 */
function getDonorRadius(urgencyLevel) {
  return DONOR_RADIUS[urgencyLevel] || DONOR_RADIUS.Normal;
}

/**
 * Calculates the distance between two coordinates in meters using the Haversine formula.
 * @param {Array} coords1 - [longitude, latitude]
 * @param {Array} coords2 - [longitude, latitude]
 * @returns {Number} Distance in meters
 */
function calculateDistance(coords1, coords2) {
  if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) {
    return Infinity;
  }
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

module.exports = {
  getBloodBankRadius,
  getDonorRadius,
  calculateDistance,
};
