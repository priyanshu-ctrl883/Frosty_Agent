import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabaseServer";

export const middleware = async (request: NextRequest) => updateSession(request);

export const config = {
  matcher: [
    // /auth/callback and /reset-password finish PKCE in the browser — middleware getUser() races them.
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|reset-password|api-proxy|demo-api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
