import type { ClientOptions } from "./client-options.js";
import type { AuthScheme } from "./core/api-request.js";
import { oauth2Scheme } from "./core/auth/oauth2-schemes.js";
import { oauth2ClientCredentialsStrategy } from "./core/auth/oauth2-strategies.js";
import type { RawClient } from "./core/raw-client.js";
import type { Servers } from "./servers.js";

export type AuthSchemes = {
  readonly oauth2: AuthScheme;
};

export function buildAuthSchemes(
  options: ClientOptions,
  servers: Servers,
  rawClient: RawClient,
): AuthSchemes {
  return {
    oauth2: oauth2Scheme(
      options.oauth2,
      options.oauth2Strategy ??
        oauth2ClientCredentialsStrategy({
          tokenUrl: servers.default("/v1/oauth2/token"),
          rawClient,
          placement: "header",
        }),
    ),
  };
}
