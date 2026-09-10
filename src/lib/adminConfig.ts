/**
 * IMPORTANT: This list is used for:
 *  1. Assigning role: "admin" during OAuth login and user provisioning in MongoDB.
 *  2. Enforcing admin-only actions on server API routes.
 */
export const ADMIN_EMAILS = [
  '325prashant0009@dbit.in',
  'marathiclubdbit26@gmail.com',
] as const;

export type AdminEmail = (typeof ADMIN_EMAILS)[number];

/**
 * Returns true if the given email is an authorized admin address.
 * Comparison is case-insensitive.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return (
    (ADMIN_EMAILS as readonly string[]).some((admin) => admin.toLowerCase() === normalized) ||
    envAdmins.includes(normalized)
  );
}

