type OAuthEnv = Env & {
  GITHUB_OAUTH_ID?: string;
  GITHUB_OAUTH_SECRET?: string;
  IG_USER_ID?: string;
  IG_ACCESS_TOKEN?: string;
  IG_POST_ADMIN_TOKEN?: string;
  IG_GRAPH_VERSION?: string;
};

type GitHubTokenResponse = {
  access_token?: unknown;
  error?: unknown;
  error_description?: unknown;
};

type InstagramApiResponse = {
  id?: string;
  status_code?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type InstagramPublishRequest = {
  caption?: unknown;
  imageUrls?: unknown;
};

function isGitHubTokenResponse(value: unknown): value is GitHubTokenResponse {
  return typeof value === "object" && value !== null;
}

const OAUTH_STATE_COOKIE = "buildscope_oauth_state";
const OAUTH_STATE_TTL_SECONDS = 10 * 60;
const DEFAULT_IG_GRAPH_VERSION = "v24.0";

function jsonLog(level: "info" | "error", message: string, details: Record<string, unknown> = {}) {
  const entry = JSON.stringify({ level, message, ...details });
  if (level === "error") {
    console.error(entry);
  } else {
    console.log(entry);
  }
}

function noStoreHeaders(extra: HeadersInit = {}): Headers {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  return headers;
}

function jsonResponse(payload: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers: noStoreHeaders({
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    }),
  });
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    const key = pair.slice(0, separator).trim();
    if (key === name) return pair.slice(separator + 1).trim();
  }

  return null;
}

function callbackUrl(env: Env): string {
  return `${env.CMS_ORIGIN}/callback?provider=github`;
}

function stateCookie(state: string): string {
  return [
    `${OAUTH_STATE_COOKIE}=${state}`,
    "Path=/callback",
    `Max-Age=${OAUTH_STATE_TTL_SECONDS}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

function clearStateCookie(): string {
  return `${OAUTH_STATE_COOKIE}=; Path=/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function createState(): string {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  return Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

function callbackPage(status: "success" | "error", payload: string, cmsOrigin: string): Response {
  const message = `authorization:github:${status}:${JSON.stringify({ token: payload })}`;
  const script = `
    (() => {
      const targetOrigin = ${JSON.stringify(cmsOrigin)};
      const completionMessage = ${JSON.stringify(message)};
      const receiveMessage = (event) => {
        if (event.origin !== targetOrigin || event.source !== window.opener) return;
        window.opener.postMessage(completionMessage, targetOrigin);
        window.removeEventListener("message", receiveMessage);
      };
      window.addEventListener("message", receiveMessage);
      if (window.opener) window.opener.postMessage("authorizing:github", targetOrigin);
    })();
  `;

  return new Response(
    `<!doctype html><html lang="zh-Hant-HK"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BuildScope 後台登入</title></head><body><p>${status === "success" ? "正在完成登入…" : "登入失敗，請關閉視窗後再試。"}</p><script>${script}</script></body></html>`,
    {
      status: status === "success" ? 200 : 400,
      headers: noStoreHeaders({
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'none'; img-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        "Set-Cookie": clearStateCookie(),
      }),
    },
  );
}

function requireOAuthSecrets(env: OAuthEnv): { id: string; secret: string } | null {
  if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) return null;
  return { id: env.GITHUB_OAUTH_ID, secret: env.GITHUB_OAUTH_SECRET };
}

function requireInstagramSecrets(env: OAuthEnv): { igUserId: string; accessToken: string; adminToken: string; graphVersion: string } | null {
  if (!env.IG_USER_ID || !env.IG_ACCESS_TOKEN || !env.IG_POST_ADMIN_TOKEN) return null;
  return {
    igUserId: env.IG_USER_ID,
    accessToken: env.IG_ACCESS_TOKEN,
    adminToken: env.IG_POST_ADMIN_TOKEN,
    graphVersion: env.IG_GRAPH_VERSION || DEFAULT_IG_GRAPH_VERSION,
  };
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length).trim();
  return request.headers.get("X-BuildScope-Admin-Token");
}

function assertPublicHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function instagramPost<T extends InstagramApiResponse>(path: string, body: URLSearchParams, graphVersion: string): Promise<T> {
  const response = await fetch(`https://graph.instagram.com/${graphVersion}${path}`, {
    method: "POST",
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as T;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || `Instagram API request failed with status ${response.status}`);
  }

  return payload;
}

async function instagramGet<T extends InstagramApiResponse>(path: string, accessToken: string, graphVersion: string): Promise<T> {
  const url = new URL(`https://graph.instagram.com/${graphVersion}${path}`);
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url.toString());
  const payload = (await response.json().catch(() => ({}))) as T;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || `Instagram API request failed with status ${response.status}`);
  }
  return payload;
}

async function waitForContainer(containerId: string, accessToken: string, graphVersion: string): Promise<string | undefined> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const status = await instagramGet<InstagramApiResponse>(`/${containerId}?fields=status_code`, accessToken, graphVersion);
    if (!status.status_code || status.status_code === "FINISHED") return status.status_code;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(`Instagram media container status: ${status.status_code}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return "IN_PROGRESS";
}

async function handleInstagramPublish(request: Request, env: OAuthEnv): Promise<Response> {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });

  const credentials = requireInstagramSecrets(env);
  if (!credentials) {
    jsonLog("error", "Instagram publishing secrets are missing");
    return jsonResponse({ error: "Instagram publishing is not configured" }, { status: 503 });
  }

  const suppliedToken = getBearerToken(request);
  if (!suppliedToken || !constantTimeEqual(suppliedToken, credentials.adminToken)) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: InstagramPublishRequest;
  try {
    payload = (await request.json()) as InstagramPublishRequest;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  const caption = typeof payload.caption === "string" ? payload.caption.trim() : "";
  if (!caption) return jsonResponse({ error: "Caption is required" }, { status: 400 });

  if (!Array.isArray(payload.imageUrls)) {
    return jsonResponse({ error: "imageUrls must be an array" }, { status: 400 });
  }

  const imageUrls = payload.imageUrls.map(assertPublicHttpsUrl).filter((url): url is string => Boolean(url));
  if (imageUrls.length !== payload.imageUrls.length) {
    return jsonResponse({ error: "Every image URL must be a public https URL" }, { status: 400 });
  }
  if (imageUrls.length < 1 || imageUrls.length > 10) {
    return jsonResponse({ error: "Instagram carousel supports 1 to 10 images" }, { status: 400 });
  }

  try {
    jsonLog("info", "Starting Instagram publish", { imageCount: imageUrls.length });

    let creationId: string | undefined;
    const { igUserId, accessToken, graphVersion } = credentials;

    if (imageUrls.length === 1) {
      const imageContainer = await instagramPost<InstagramApiResponse>(
        `/${igUserId}/media`,
        new URLSearchParams({ image_url: imageUrls[0], caption, access_token: accessToken }),
        graphVersion,
      );
      creationId = imageContainer.id;
    } else {
      const children: string[] = [];
      for (const imageUrl of imageUrls) {
        const child = await instagramPost<InstagramApiResponse>(
          `/${igUserId}/media`,
          new URLSearchParams({ image_url: imageUrl, is_carousel_item: "true", access_token: accessToken }),
          graphVersion,
        );
        if (!child.id) throw new Error("Instagram did not return a child media container ID");
        children.push(child.id);
      }

      const carousel = await instagramPost<InstagramApiResponse>(
        `/${igUserId}/media`,
        new URLSearchParams({ media_type: "CAROUSEL", children: children.join(","), caption, access_token: accessToken }),
        graphVersion,
      );
      creationId = carousel.id;
    }

    if (!creationId) throw new Error("Instagram did not return a media container ID");

    const status = await waitForContainer(creationId, accessToken, graphVersion);
    const published = await instagramPost<InstagramApiResponse>(
      `/${igUserId}/media_publish`,
      new URLSearchParams({ creation_id: creationId, access_token: accessToken }),
      graphVersion,
    );

    jsonLog("info", "Instagram publish completed", { creationId, mediaId: published.id });
    return jsonResponse({ ok: true, creationId, mediaId: published.id, status });
  } catch (error) {
    jsonLog("error", "Instagram publish failed", { error: error instanceof Error ? error.message : String(error) });
    return jsonResponse({ error: error instanceof Error ? error.message : "Instagram publish failed" }, { status: 502 });
  }
}

async function handleAuth(request: Request, env: OAuthEnv): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
  if (url.searchParams.get("provider") !== "github") {
    return new Response("Invalid provider", { status: 400, headers: noStoreHeaders() });
  }

  const credentials = requireOAuthSecrets(env);
  if (!credentials) {
    jsonLog("error", "GitHub OAuth secrets are missing", { path: url.pathname });
    return new Response("CMS authentication is not configured", { status: 503, headers: noStoreHeaders() });
  }

  const state = createState();
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", credentials.id);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl(env));
  authorizeUrl.searchParams.set("scope", "public_repo read:user");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("allow_signup", "false");

  jsonLog("info", "Starting GitHub OAuth", { path: url.pathname });
  return new Response(null, {
    status: 302,
    headers: noStoreHeaders({
      Location: authorizeUrl.toString(),
      "Set-Cookie": stateCookie(state),
    }),
  });
}

async function handleCallback(request: Request, env: OAuthEnv): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
  if (url.searchParams.get("provider") !== "github") {
    return callbackPage("error", "Invalid provider", env.CMS_ORIGIN);
  }

  const credentials = requireOAuthSecrets(env);
  if (!credentials) {
    jsonLog("error", "GitHub OAuth secrets are missing", { path: url.pathname });
    return callbackPage("error", "Authentication is not configured", env.CMS_ORIGIN);
  }

  const state = url.searchParams.get("state");
  const cookieState = getCookie(request, OAUTH_STATE_COOKIE);
  const code = url.searchParams.get("code");
  if (!state || !cookieState || !constantTimeEqual(state, cookieState) || !code) {
    jsonLog("error", "Rejected invalid OAuth callback", {
      path: url.pathname,
      hasState: Boolean(state),
      hasCookieState: Boolean(cookieState),
      hasCode: Boolean(code),
    });
    return callbackPage("error", "Invalid or expired authentication request", env.CMS_ORIGIN);
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "BuildScope-Decap-CMS",
    },
    body: JSON.stringify({
      client_id: credentials.id,
      client_secret: credentials.secret,
      code,
      redirect_uri: callbackUrl(env),
    }),
  });

  let tokenPayload: GitHubTokenResponse;
  try {
    const rawPayload: unknown = await tokenResponse.json();
    if (!isGitHubTokenResponse(rawPayload)) throw new Error("Unexpected token response shape");
    tokenPayload = rawPayload;
  } catch (error) {
    jsonLog("error", "GitHub OAuth returned invalid JSON", {
      status: tokenResponse.status,
      error: error instanceof Error ? error.message : String(error),
    });
    return callbackPage("error", "GitHub returned an invalid response", env.CMS_ORIGIN);
  }

  if (!tokenResponse.ok || typeof tokenPayload.access_token !== "string") {
    jsonLog("error", "GitHub OAuth token exchange failed", {
      status: tokenResponse.status,
      oauthError: typeof tokenPayload.error === "string" ? tokenPayload.error : "unknown",
    });
    return callbackPage("error", "GitHub authorization failed", env.CMS_ORIGIN);
  }

  jsonLog("info", "GitHub OAuth completed", { repository: env.GITHUB_REPOSITORY });
  return callbackPage("success", tokenPayload.access_token, env.CMS_ORIGIN);
}

export default {
  async fetch(request: Request, env: OAuthEnv): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/admin") && url.origin !== env.CMS_ORIGIN) {
        const canonicalUrl = new URL(`${url.pathname}${url.search}`, env.CMS_ORIGIN);
        return Response.redirect(canonicalUrl.toString(), 308);
      }
      if (url.pathname === "/auth") return await handleAuth(request, env);
      if (url.pathname === "/callback") return await handleCallback(request, env);
      if (url.pathname === "/api/instagram/publish") return await handleInstagramPublish(request, env);
      return env.ASSETS.fetch(request);
    } catch (error) {
      jsonLog("error", "Unhandled Worker error", {
        path: url.pathname,
        error: error instanceof Error ? error.message : String(error),
      });
      return new Response("Internal server error", { status: 500, headers: noStoreHeaders() });
    }
  },
} satisfies ExportedHandler<OAuthEnv>;
