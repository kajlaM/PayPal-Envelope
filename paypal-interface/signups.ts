// People who sign up on the site (demo guests, e.g. organizers). They don't have a PayPal sandbox account
// of their own: every sign-up logs into one shared demo customer (SIGNUP_BASE_ACCOUNT, default "kajla"),
// same vaults, same PayPal link and balance, but the site greets them by their own name and alert emails
// go to the email they signed up with. A business sign-up instead opens the shared demo shop's seller
// dashboard (SIGNUP_BUSINESS_ACCOUNT, default "audiostore"), greeted by their own name.
//
// Stored in data/signups.json (passwords as scrypt hashes). The person who logged in last is written to
// data/alert-recipient.json, which the API's notify.ts reads to fill email_to for the shared account.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ACCOUNTS, BUSINESS_ACCOUNTS, type Account, type BusinessAccount } from './accounts.ts';

export type SignUpKind = 'personal' | 'business';
export type SignUp = { id: string; kind?: SignUpKind; name: string; email: string; passwordHash: string; createdAt: string };

export const isBusiness = (signup: SignUp) => signup.kind === 'business';

const DATA_DIR = fileURLToPath(new URL('./data/', import.meta.url));
const FILE = `${DATA_DIR}signups.json`;
const RECIPIENT_FILE = `${DATA_DIR}alert-recipient.json`;

export const SIGNUP_PREFIX = 'su-'; // session cookie username of a sign-up: "su-<id>"

function load(): SignUp[] {
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as SignUp[];
  } catch {
    return [];
  }
}

const signups = load();

function save() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(signups, null, 2));
}

function hash(password: string, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

function passwordMatches(stored: string, password: string) {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const given = Buffer.from(hash(password, salt).split(':')[1]!, 'hex');
  const want = Buffer.from(expected, 'hex');
  return given.length === want.length && timingSafeEqual(given, want);
}

/** The demo customer every sign-up logs into. */
export function baseAccount(): Account {
  const key = process.env.SIGNUP_BASE_ACCOUNT?.trim().toLowerCase() || 'kajla';
  const account = ACCOUNTS[key];
  if (!account) throw new Error(`SIGNUP_BASE_ACCOUNT "${key}" is not a customer in accounts.ts`);
  return account;
}

/** The demo shop every business sign-up logs into. */
export function baseBusiness(): BusinessAccount {
  const key = process.env.SIGNUP_BUSINESS_ACCOUNT?.trim().toLowerCase() || 'audiostore';
  const biz = BUSINESS_ACCOUNTS[key];
  if (!biz) throw new Error(`SIGNUP_BUSINESS_ACCOUNT "${key}" is not a business in accounts.ts`);
  return biz;
}

/**
 * The shared customer, shown with the sign-up's own name. `username` stays the base one (PayPal link,
 * balance); `signupId` makes every password check (payments, approvals) use the sign-up's own password.
 */
export const accountFor = (signup: SignUp): Account & { signupId: string } => ({ ...baseAccount(), name: signup.name, signupId: signup.id });

/** For a sign-up's session: does `password` match their own password? `null` when it isn't a sign-up. */
export function signUpPasswordOk(account: Account, password: unknown): boolean | null {
  const id = (account as { signupId?: string }).signupId;
  if (!id) return null;
  const signup = findSignUp(id);
  return !!signup && passwordMatches(signup.passwordHash, String(password ?? ''));
}

/** Email buttons (no session): the password of the sign-up who gets this account's alerts. */
export function recipientPasswordOk(account: Account, password: unknown, vaultId?: string) {
  try {
    const map = JSON.parse(readFileSync(RECIPIENT_FILE, 'utf8')) as Record<string, { email?: string }>;
    const email = (vaultId && map[`vault:${vaultId}`]?.email) || map[account.sandboxEmail.toLowerCase()]?.email || '';
    const signup = findByEmail(email);
    return !!signup && passwordMatches(signup.passwordHash, String(password ?? ''));
  } catch {
    return false;
  }
}

export const findSignUp = (id: string) => signups.find((s) => s.id === id) ?? null;

export const findByEmail = (email: string) => signups.find((s) => s.email === email.trim().toLowerCase()) ?? null;

export function checkSignUpLogin(email: string, password: string) {
  const signup = findByEmail(email);
  return signup && passwordMatches(signup.passwordHash, password) ? signup : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class SignUpError extends Error {}

export function createSignUp(input: { kind?: unknown; name: unknown; email: unknown; password: unknown; confirmPassword: unknown }) {
  const kind: SignUpKind = input.kind === 'business' ? 'business' : 'personal';
  const name = String(input.name ?? '').trim().replace(/\s+/g, ' ');
  const email = String(input.email ?? '').trim().toLowerCase();
  const password = String(input.password ?? '');
  if (name.length < 2 || name.length > 60) throw new SignUpError('Enter your name (2 to 60 characters).');
  if (!EMAIL.test(email)) throw new SignUpError('Enter a valid email address.');
  if (password.length < 6) throw new SignUpError('Password must be at least 6 characters.');
  if (password !== String(input.confirmPassword ?? '')) throw new SignUpError('Passwords do not match.');
  const taken =
    findByEmail(email) ||
    Object.values(ACCOUNTS).some((a) => a.username === email || a.sandboxEmail.toLowerCase() === email) ||
    Object.values(BUSINESS_ACCOUNTS).some((b) => b.username === email || b.loginEmails.some((e) => e.toLowerCase() === email));
  if (taken) throw new SignUpError('An account with this email already exists. Log in instead.');
  const signup: SignUp = { id: randomBytes(9).toString('hex'), kind, name, email, passwordHash: hash(password), createdAt: new Date().toISOString() };
  signups.push(signup);
  save();
  return signup;
}

/**
 * Alerts of the shared account go to whoever logged in last: a sign-up's own email, or (when the demo
 * customer logs in directly, `null`) back to the ALERT_RECIPIENTS mapping in .env.
 */
export function setAlertRecipient(account: Account, signup: SignUp | null) {
  let current: Record<string, { email: string; name: string }> = {};
  try {
    current = JSON.parse(readFileSync(RECIPIENT_FILE, 'utf8'));
  } catch {
    // first write
  }
  const key = account.sandboxEmail.toLowerCase();
  if (signup) current[key] = { email: signup.email, name: signup.name };
  else delete current[key];
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(RECIPIENT_FILE, JSON.stringify(current, null, 2));
}

/**
 * Every sign-up shares one demo customer, so "whoever logged in last" can be someone else by the time a
 * vault's emails go out. Remember who made each vault: notify.ts reads `vault:<id>` before the account's
 * last-login entry, so a vault's alerts always reach the sign-up who created it.
 */
export function setVaultRecipient(vaultId: string, signup: SignUp) {
  let current: Record<string, { email: string; name: string }> = {};
  try {
    current = JSON.parse(readFileSync(RECIPIENT_FILE, 'utf8'));
  } catch {
    // first write
  }
  current[`vault:${vaultId}`] = { email: signup.email, name: signup.name };
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(RECIPIENT_FILE, JSON.stringify(current, null, 2));
}
