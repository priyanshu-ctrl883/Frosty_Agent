"use client";

import { APP_URL, SUPABASE_CONFIGURED } from "./constants";
import { safeNextPath } from "./authPaths";
import { supabase } from "./supabase";
import { apiRequest, ApiClientError } from "./api";

const AUTH_TOKEN_KEY = "frosty.auth_token";

export const setSessionToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  try {
    document.cookie = `frosty_auth_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
  } catch {
    // ignore
  }
};

export const clearSessionToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  try {
    document.cookie = "frosty_auth_token=; path=/; max-age=0; SameSite=Lax";
  } catch {
    // ignore
  }
};

/** Re-write frosty_auth_token cookie from localStorage before a cross-site redirect (e.g. Razorpay). */
export const refreshFrostySessionCookie = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem(AUTH_TOKEN_KEY) ?? (await getToken());
  if (token) setSessionToken(token);
};

/**
 * Merchant session — Local token or Supabase Auth.
 *
 * `getToken()` is async and returns the CURRENT token.
 */
export const getToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const localToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (localToken) return localToken;
  if (!SUPABASE_CONFIGURED) return null;
  const { data } = await supabase().auth.getSession();
  return data.session?.access_token ?? null;
};


/**
 * Wait until a session exists (cookie hydration or PKCE), or time out.
 * Used after `/auth/callback` redirects to `/signup/google`.
 */
export const waitForSession = async (timeoutMs = 8000): Promise<string | null> => {
  if (typeof window === "undefined" || !SUPABASE_CONFIGURED) return null;
  const existing = await supabase().auth.getSession();
  if (existing.data.session?.access_token) return existing.data.session.access_token;

  return new Promise((resolve) => {
    let done = false;
    const finish = (token: string | null) => {
      if (done) return;
      done = true;
      subscription.unsubscribe();
      clearTimeout(tid);
      resolve(token);
    };
    const {
      data: { subscription },
    } = supabase().auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) finish(session.access_token);
    });
    const tid = setTimeout(() => {
      void supabase()
        .auth.getSession()
        .then(({ data }) => finish(data.session?.access_token ?? null));
    }, timeoutMs);
  });
};

const readRecoveryParams = (): { query: URLSearchParams; hash: URLSearchParams } => {
  const query = new URLSearchParams(window.location.search);
  const hashStr = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return { query, hash: new URLSearchParams(hashStr) };
};

const hasPasswordRecoveryHint = (): boolean => {
  if (typeof window === "undefined") return false;
  const { query, hash } = readRecoveryParams();
  return (
    query.has("code") ||
    query.has("token_hash") ||
    query.get("type") === "recovery" ||
    hash.get("type") === "recovery" ||
    Boolean(hash.get("access_token"))
  );
};

const stripRecoveryParamsFromUrl = (): void => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

let passwordRecoveryInFlight: Promise<boolean> | null = null;

/**
 * Recovery is an auth event (or a URL that can produce one), not a timer.
 * An already-logged-in user hitting `/reset-password` without a recovery hint
 * must not see the form.
 *
 * Supabase recovery emails redirect with hash fragments (#access_token=…&type=recovery).
 * @supabase/ssr cookie storage does not auto-parse those — setSession is required.
 * PKCE ?code= uses exchangeCodeForSession. Middleware must not run on this path.
 */
const waitForPasswordRecoveryOnce = async (timeoutMs = 15000): Promise<boolean> => {
  if (typeof window === "undefined" || !SUPABASE_CONFIGURED) return false;
  if (!hasPasswordRecoveryHint()) return false;

  const client = supabase();
  const { query, hash } = readRecoveryParams();

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error && data.session) {
      stripRecoveryParamsFromUrl();
      return true;
    }
  }

  const tokenHash = query.get("token_hash");
  if (tokenHash) {
    const type =
      (query.get("type") as "recovery" | "signup" | "invite" | "magiclink" | null) ?? "recovery";
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && data.session) {
      stripRecoveryParamsFromUrl();
      return true;
    }
  }

  const code = query.get("code");
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      stripRecoveryParamsFromUrl();
      return true;
    }
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      subscription.unsubscribe();
      clearTimeout(tid);
      if (ok) stripRecoveryParamsFromUrl();
      resolve(ok);
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        finish(true);
      }
    });

    const tid = setTimeout(() => {
      void client.auth.getSession().then(({ data }) => finish(Boolean(data.session)));
    }, timeoutMs);

    void client.auth.getSession();
  });
};

export const waitForPasswordRecovery = (timeoutMs = 15000): Promise<boolean> => {
  if (hasIamResetToken()) {
    return Promise.resolve(true);
  }
  if (!passwordRecoveryInFlight) {
    passwordRecoveryInFlight = waitForPasswordRecoveryOnce(timeoutMs).finally(() => {
      passwordRecoveryInFlight = null;
    });
  }
  return passwordRecoveryInFlight;
};

const authErrorMessage = (raw: string, code?: string): string => {
  const m = raw.toLowerCase();
  if (code === "no_workspace" || m.includes("no workspace")) {
    return "Your account exists but has no workspace yet. Finish signup or use Forgot password.";
  }
  if (code === "invalid_credentials" || m.includes("invalid email or password")) {
    return "Could not sign in. Check your email and password.";
  }
  if (code === "network_error" || m.includes("cannot reach the api") || m.includes("failed to fetch")) {
    return "Cannot reach the server. Make sure the API is running and try again.";
  }
  if (m.includes("already registered") || m.includes("already exists") || m.includes("user already")) {
    return "Could not create that account. Try signing in instead.";
  }
  if (
    m.includes("invalid login") ||
    m.includes("invalid credentials") ||
    m.includes("authentication credentials") ||
    m.includes("email not confirmed") ||
    m.includes("not confirmed") ||
    m.includes("user not found") ||
    m.includes("invalid email or password")
  ) {
    return "Could not sign in. Check your email and password.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Too many attempts — try again shortly.";
  }
  return "Something went wrong. Please try again.";
};

export const signIn = async (email: string, password: string): Promise<void> => {
  let iamRejected = false;

  try {
    const res = await apiRequest<{ access_token: string }>("/v1/iam/login", {
      method: "POST",
      body: { email, password },
    });
    if (res?.access_token) {
      setSessionToken(res.access_token);
      return;
    }
  } catch (err) {
    if (err instanceof ApiClientError) {
      if (err.status === 401 || err.status === 404) {
        iamRejected = true;
      } else if (err.status === 403 && err.code === "no_workspace") {
        throw new Error(authErrorMessage(err.message, err.code));
      } else {
        throw new Error(authErrorMessage(err.message, err.code));
      }
    } else {
      throw err;
    }
  }

  if (!SUPABASE_CONFIGURED) {
    throw new Error(
      iamRejected
        ? "Could not sign in. Check your email and password."
        : authErrorMessage("invalid email or password"),
    );
  }
  const { error } = await supabase().auth.signInWithPassword({ email, password });
  if (error) {
    const supabaseMsg = authErrorMessage(error.message);
    if (iamRejected && supabaseMsg === "Something went wrong. Please try again.") {
      throw new Error("Could not sign in. Check your email and password.");
    }
    throw new Error(supabaseMsg);
  }
};

let oauthInFlight = false;

const oauthRedirectTo = (nextPath: string): string => {
  const origin = window.location.origin.replace(/\/+$/, "");
  let path = nextPath;
  if (!path.startsWith("/") || path.startsWith("//")) {
    try {
      const parsed = new URL(path);
      path = parsed.origin === origin ? `${parsed.pathname}${parsed.search}` : "/signup/google";
    } catch {
      path = "/signup/google";
    }
  }
  const next = safeNextPath(path, "/signup/google");
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
};

export const signInWithGoogle = async (nextPath = "/signup/google"): Promise<void> => {
  if (!SUPABASE_CONFIGURED) return;
  if (oauthInFlight) return;
  oauthInFlight = true;
  try {
    const { error } = await supabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: oauthRedirectTo(nextPath),
        skipBrowserRedirect: false,
      },
    });
    if (error) throw new Error(authErrorMessage(error.message));
  } catch (err) {
    oauthInFlight = false;
    throw err;
  }
};

/**
 * Create the Supabase identity. Does NOT create the merchant — that is `POST /v1/iam/bootstrap`,
 * which the signup screen calls next with the company name.
 *
 * The two steps cannot be collapsed: `bootstrap` requires a VERIFIED Supabase token (it is
 * `require_supabase_principal`, and the merchant is keyed on the auth uid), so the identity has to
 * exist first. It is idempotent on that uid, which is what makes an interrupted signup resumable
 * rather than a duplicate merchant.
 *
 * Returns whether a session came back. With "confirm email" enabled on the Supabase project,
 * sign-up returns a user and NO session — so the caller must not try to bootstrap yet, and must
 * say so instead of failing silently.
 */
export const signUp = async (
  email: string,
  password: string,
): Promise<{ session: boolean; accessToken: string | null }> => {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin.replace(/\/+$/, "")}/auth/callback?next=${encodeURIComponent("/login")}`
      : undefined;
  const { data, error } = await supabase().auth.signUp({
    email,
    password,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });
  if (error) throw new Error(authErrorMessage(error.message));
  return { session: Boolean(data.session), accessToken: data.session?.access_token ?? null };
};

export const signOut = async (): Promise<void> => {
  clearSessionToken();
  if (!SUPABASE_CONFIGURED) return;
  await supabase().auth.signOut();
};


/** Supabase recovery link target — must match an entry in the project's Redirect URLs allowlist. */
export const buildPasswordResetRedirectUrl = (): string => {
  // Keep recovery on /reset-password (not /auth/callback) so PASSWORD_RECOVERY fires in-page.
  if (typeof window !== "undefined") {
    return `${window.location.origin.replace(/\/+$/, "")}/reset-password`;
  }
  const fromEnv = APP_URL.replace(/\/+$/, "");
  if (fromEnv) return `${fromEnv}/reset-password`;
  return "/reset-password";
};

export const sendPasswordResetEmail = async (email: string, redirectTo?: string): Promise<void> => {
  if (!SUPABASE_CONFIGURED) return;
  const target = redirectTo ?? buildPasswordResetRedirectUrl();
  const { error } = await supabase().auth.resetPasswordForEmail(email, { redirectTo: target });
  if (error) throw new Error(authErrorMessage(error.message));
};

export const updatePassword = async (password: string): Promise<void> => {
  if (!SUPABASE_CONFIGURED) return;
  const { error } = await supabase().auth.updateUser({ password });
  if (error) throw new Error(authErrorMessage(error.message));
};

export const resetPasswordWithToken = async (token: string, password: string): Promise<void> => {
  await apiRequest("/v1/iam/reset-password", {
    method: "POST",
    body: { token, password },
  });
};

const hasIamResetToken = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(new URLSearchParams(window.location.search).get("token"));
};
