import type { TokenProvider } from "./core/auth/credentials.js";
import type { CoreClientOptions } from "./core/client-options.js";

export type ClientOptions = SdkClientOptions & CoreClientOptions;

type SdkClientOptions = ServerOptions & {
  /**
   * Only PayPalVault's own site, agent and background jobs have it. Never given to outside agents
   * or tools.
   */
  readonly internalKey?: TokenProvider | undefined;
};

type ServerOptions = {
  /** Private: the API is never exposed (the site forwards only what it needs) */
  readonly serverOptions?: {
    baseUrl?: string;
  };
};
