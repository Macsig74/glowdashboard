export const ADMIN_USERNAMES = ["maxim", "mystic", "dr4"] as const;

export function isAdmin(username: string | null | undefined): boolean {
  if (!username) return false;
  return (ADMIN_USERNAMES as readonly string[]).includes(username.toLowerCase());
}
