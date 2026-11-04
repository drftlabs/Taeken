import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Keeps login sessions fresh and gates /account and /admin behind a login.
export async function middleware(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const p = request.nextUrl.pathname;
  const needsLogin = (p.startsWith("/account") && !p.startsWith("/account/login")) || (p.startsWith("/admin") && !p.startsWith("/admin/login"));
  if (needsLogin && !user) {
    const to = request.nextUrl.clone();
    to.pathname = p.startsWith("/admin") ? "/admin/login" : "/account/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = { matcher: ["/account/:path*", "/admin/:path*"] };
