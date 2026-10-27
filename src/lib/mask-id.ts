/** "1990123456789" becomes "•••• 6789": hides all but the last 4 characters. */
export function maskId(id: string, visible = 4): string {
  if (id.length <= visible) return id;
  return `•••• ${id.slice(-visible)}`;
}
