export function generateQuickId(uuid: string | undefined): string {
  if (!uuid) return '';
  let hash = 5381;
  for (let i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) + hash) + uuid.charCodeAt(i);
  }
  return Math.abs(hash).toString().padStart(9, '0').substring(0, 9);
}

export function isIdPublic(uuid: string | undefined): boolean {
  if (!uuid) return false;
  return localStorage.getItem(`isIdPublic_${uuid}`) !== 'false'; // Default to true if not set
}

export function setIdPublic(uuid: string | undefined, isPublic: boolean): void {
  if (!uuid) return;
  localStorage.setItem(`isIdPublic_${uuid}`, isPublic.toString());
}
