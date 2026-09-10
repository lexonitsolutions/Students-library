export function generateQuickId(uuid: string | undefined): string {
  if (!uuid) return '';
  let hash = 5381;
  for (let i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) + hash) + uuid.charCodeAt(i);
  }
  return Math.abs(hash).toString().padStart(9, '0').substring(0, 9);
}

