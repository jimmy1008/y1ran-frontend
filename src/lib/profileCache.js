let cache = {
  userId: null,
  profile: null,
  ts: 0,
};

export function getCachedProfile(userId) {
  if (!userId) return null;
  if (cache.userId !== userId) return null;
  return cache.profile;
}

export function setCachedProfile(userId, profile) {
  if (!userId) return;
  cache = { userId, profile, ts: Date.now() };
}

export function isCacheFresh(maxAgeMs = 60_000) {
  return Date.now() - cache.ts < maxAgeMs;
}
