// Demo customers of the PayPal-style site. Each one is linked to a PayPal sandbox personal account:
// vaults they create belong to that sandbox user, they pay into vaults from it, and refunds go back to it.
// Passwords are demo-only and never leave the server.
//
// The balance shown on the site is read live from the sandbox account itself (sandbox-balance.ts),
// using the sandbox login password from .env (`sandboxPasswordEnv`). Nothing is hardcoded here.

export type Account = {
  username: string;
  name: string;
  password: string;
  sandboxEmail: string;
  sandboxPasswordEnv: string; // .env variable holding the sandbox.paypal.com login password
};

export const ACCOUNTS: Record<string, Account> = {
  kajla: {
    username: 'kajla',
    name: 'Kajla',
    password: '1234',
    sandboxEmail: 'kajla@personal.example.com',
    sandboxPasswordEnv: 'KAJLA_SANDBOX_PASSWORD',
  },
  jugal: {
    username: 'jugal',
    name: 'Jugal',
    password: '1234',
    sandboxEmail: 'jugal@personal.example.com',
    sandboxPasswordEnv: 'JUGAL_SANDBOX_PASSWORD',
  },
};

// Business logins: shops that AI agents buy from. Each one is a PayPal sandbox business account; every
// registered merchant paid out to that account (merchants.sandboxEmail) is one of its storefronts.
// A business login opens the seller dashboard (/business), never the wallet. Log in with the username
// or any of `loginEmails`. The live balance is read from the sandbox business account itself
// (business-balance.ts), using the sandbox login password from .env (`sandboxPasswordEnv`).
export type BusinessAccount = {
  username: string;
  name: string;
  password: string;
  loginEmails: string[];
  sandboxEmail: string; // the PayPal sandbox business account that receives the payments
  sandboxPasswordEnv: string; // .env variable holding its sandbox.paypal.com login password
  apiEnvPrefix: string; // <prefix>_API_USERNAME / _API_PASSWORD / _API_SIGNATURE: NVP API credentials (GetBalance)
};

const audioSandbox = process.env.AUDIO_STORE_SANDBOX_EMAIL?.trim() || 'audio-store-wallet@business.example.com';
const citySandbox = process.env.CITY_UTILITY_SANDBOX_EMAIL?.trim() || 'city-utility@business.example.com';

export const BUSINESS_ACCOUNTS: Record<string, BusinessAccount> = {
  audiostore: {
    username: 'audiostore',
    name: 'Audio Store',
    password: '12345678',
    loginEmails: ['audiostore@buisness.example.com', 'audiostore@business.example.com', audioSandbox],
    sandboxEmail: audioSandbox,
    sandboxPasswordEnv: 'AUDIO_STORE_SANDBOX_PASSWORD',
    apiEnvPrefix: 'AUDIO_STORE',
  },
  cityutility: {
    username: 'cityutility',
    name: 'City Utility',
    password: '12345678',
    loginEmails: ['citiutility@buisness.example.com', 'cityutility@business.example.com', citySandbox],
    sandboxEmail: citySandbox,
    sandboxPasswordEnv: 'CITY_UTILITY_SANDBOX_PASSWORD',
    apiEnvPrefix: 'CITY_UTILITY',
  },
};
