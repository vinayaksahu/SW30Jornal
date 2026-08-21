import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
      const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');

      const protectedRoutes = [
        '/dashboard',
        '/accounts',
        '/trades',
        '/rules',
        '/strategies',
        '/calendar',
        '/analytics',
        '/clocks',
        '/news',
        '/settings',
        '/admin',
      ];
      const isProtectedRoute =
        protectedRoutes.some((route) => nextUrl.pathname.startsWith(route)) ||
        (nextUrl.pathname.startsWith('/api') && !isApiAuthRoute);

      if (isApiAuthRoute) return true;

      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && isProtectedRoute) {
        return false;
      }

      if (isAdminRoute && (auth?.user as any)?.role !== 'ADMIN') {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id || '';
        token.role = (user as any).role || 'USER';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.role = (token.role as string) || 'USER';
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
