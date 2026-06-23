import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Backward compatibility: redirect /account/* to /dashboard/*
  if (pathname.startsWith('/account')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace('/account', '/dashboard');
    return NextResponse.redirect(url);
  }

  // 2. Auth checks
  if (user) {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'customer';

    // Check if customer has an active or pending subscription or waitlist
    let hasSubscription = false;
    let hasWaitlist = false;

    if (role === 'customer') {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('customer_id', user.id)
        .in('status', ['active', 'paused', 'pending_payment'])
        .maybeSingle();

      hasSubscription = !!subscription;

      if (!hasSubscription) {
        const { data: waitlist } = await supabase
          .from('waitlist')
          .select('id')
          .eq('customer_id', user.id)
          .in('status', ['waiting', 'notified'])
          .maybeSingle();
        hasWaitlist = !!waitlist;
      }
    }

    const hasDashboardAccess = hasSubscription || hasWaitlist;

    // Redirect logged-in users away from /login
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      if (role === 'admin') {
        url.pathname = '/admin';
      } else if (hasDashboardAccess) {
        url.pathname = '/dashboard';
      } else {
        url.pathname = '/onboarding';
      }
      return NextResponse.redirect(url);
    }

    // Protect /admin routes
    if (pathname.startsWith('/admin')) {
      if (role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }

    // Protect /dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (role === 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      } else if (!hasDashboardAccess) {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding';
        return NextResponse.redirect(url);
      }
    }

    // Protect /onboarding route
    if (pathname === '/onboarding') {
      if (role === 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      } else if (hasDashboardAccess) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  } else {
    // Unauthenticated users
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
