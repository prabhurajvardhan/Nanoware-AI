// Dependency-free auth constants. Keep this module free of Firebase Admin and other server SDK imports so
// route modules can read cookie names and lifetimes without loading the Admin SDK during module initialization.
export const SESSION_COOKIE = '__session';
export const MFA_COOKIE = '__admin_mfa';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;
export const MFA_MAX_AGE_SECONDS = 60 * 60 * 12;
