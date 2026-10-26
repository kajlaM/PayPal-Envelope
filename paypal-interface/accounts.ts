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
