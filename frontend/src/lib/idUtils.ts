export function generateQuickId(uuid: string | undefined): string {
  if (!uuid) return '';
  let hash = 5381;
  for (let i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) + hash) + uuid.charCodeAt(i);
  }
  return Math.abs(hash).toString().padStart(9, '0').substring(0, 9);
}

export function clerkIdToUuid(clerkId: string): string {
  if (!clerkId) return '00000000-0000-4000-8000-000000000000';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clerkId)) {
    return clerkId.toLowerCase();
  }
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x62a9d479, h4 = 0x3ac4e723;
  for (let i = 0; i < clerkId.length; i++) {
    const ch = clerkId.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const hex = (toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)).slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function emailToUuid(email: string): string {
  if (!email) return '00000000-0000-4000-8000-000000000000';
  const normalized = email.trim().toLowerCase();
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x62a9d479, h4 = 0x3ac4e723;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const hex = (toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)).slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

