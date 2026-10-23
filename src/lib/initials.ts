/** "RH" from "Rafi Hasan": the first letter of up to two words. */
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2);
}
