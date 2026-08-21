const LOCAL_LIKED_KEY_PREFIX = 'quicklearnit_liked_ids_';
const LOCAL_LIKES_COUNT_PREFIX = 'quicklearnit_likes_count_';

export function getLocalStorageLikedIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${LOCAL_LIKED_KEY_PREFIX}${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveLocalStorageLikedIds(userId: string, ids: Set<string>): void {
  try {
    localStorage.setItem(`${LOCAL_LIKED_KEY_PREFIX}${userId}`, JSON.stringify([...ids]));
  } catch {
    // Ignore storage errors
  }
}

export function getLocalLikesCount(materialId: string): number {
  try {
    const raw = localStorage.getItem(`${LOCAL_LIKES_COUNT_PREFIX}${materialId}`);
    if (raw) return parseInt(raw, 10) || 0;
  } catch {
    // Ignore
  }
  return 0;
}

export function setLocalLikesCount(materialId: string, count: number): void {
  try {
    localStorage.setItem(`${LOCAL_LIKES_COUNT_PREFIX}${materialId}`, count.toString());
  } catch {
    // Ignore
  }
}

export function getLocalSharesCount(materialId: string): number {
  try {
    const raw = localStorage.getItem(`quicklearnit_shares_count_${materialId}`);
    if (raw) return parseInt(raw, 10) || 0;
  } catch {
    // Ignore
  }
  return 0;
}

export function incrementLocalSharesCount(materialId: string): number {
  const newCount = getLocalSharesCount(materialId) + 1;
  try {
    localStorage.setItem(`quicklearnit_shares_count_${materialId}`, newCount.toString());
  } catch {
    // Ignore
  }
  return newCount;
}

export function getLocalDownloadsCount(materialId: string, initialDbValue: number): number {
  try {
    const raw = localStorage.getItem(`quicklearnit_downloads_count_${materialId}`);
    if (raw) {
      const localCount = parseInt(raw, 10);
      return Math.max(localCount, initialDbValue);
    }
  } catch {
    // Ignore
  }
  return initialDbValue;
}

export function incrementLocalDownloadsCount(materialId: string, currentTotal: number): number {
  const newCount = currentTotal + 1;
  try {
    localStorage.setItem(`quicklearnit_downloads_count_${materialId}`, newCount.toString());
  } catch {
    // Ignore
  }
  return newCount;
}

export async function toggleLike(userId: string, materialId: string): Promise<{ isLiked: boolean; likesCount: number }> {
  const likedIds = getLocalStorageLikedIds(userId);
  let likesCount = getLocalLikesCount(materialId);
  const isCurrentlyLiked = likedIds.has(materialId);

  if (isCurrentlyLiked) {
    likedIds.delete(materialId);
    likesCount = Math.max(0, likesCount - 1);
  } else {
    likedIds.add(materialId);
    likesCount += 1;
  }

  saveLocalStorageLikedIds(userId, likedIds);
  setLocalLikesCount(materialId, likesCount);

  return { isLiked: !isCurrentlyLiked, likesCount };
}
