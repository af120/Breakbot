/**
 * Username Normalization & Similarity Utility
 */

/**
 * Clean and normalize a raw username string according to business rules:
 * - Remove spaces before and after
 * - Convert to lowercase
 * - Strip leading '@' symbol
 * - Normalize hidden or unusual spaces (zero-width characters, non-breaking spaces, multi-spaces)
 */
function normalizeUsername(raw) {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();

  // Strip all leading '@' characters
  str = str.replace(/^@+/, '');

  // Remove zero-width & non-printable control characters
  str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Replace unusual/unicode space characters with standard ASCII space
  str = str.replace(/[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g, ' ');

  // Trim again after space replacement and convert to lowercase
  str = str.trim().toLowerCase();

  return str;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find candidate similar usernames from master list for manual review.
 * Only returns candidates with small distance or high substring match.
 */
function findSimilarUsernames(normalizedTarget, masterNormalizedUsernamesMap, maxSuggestions = 3) {
  if (!normalizedTarget || normalizedTarget.length < 3) return [];
  const candidates = [];

  for (const [normUser, masterRecord] of Object.entries(masterNormalizedUsernamesMap)) {
    if (normUser === normalizedTarget) continue; // exact match already handled

    const dist = levenshteinDistance(normalizedTarget, normUser);
    const minLen = Math.min(normalizedTarget.length, normUser.length);
    const maxLen = Math.max(normalizedTarget.length, normUser.length);

    // Criteria for "similar username candidate":
    // 1. Distance <= 2 for short/medium usernames, or <= 3 for long usernames
    // 2. Or one is contained in the other with minor digit/underscore difference
    const isClose = (maxLen <= 8 && dist <= 1) || (maxLen > 8 && dist <= 2);
    const isSub = (normUser.includes(normalizedTarget) || normalizedTarget.includes(normUser)) && (maxLen - minLen <= 2);

    if (isClose || isSub) {
      candidates.push({
        record_id: masterRecord.record_id,
        customer_name: masterRecord.customer_name,
        username: masterRecord.username,
        normalized_username: normUser,
        phone_number: masterRecord.phone_number,
        distance: dist
      });
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates.slice(0, maxSuggestions);
}

module.exports = {
  normalizeUsername,
  levenshteinDistance,
  findSimilarUsernames
};
