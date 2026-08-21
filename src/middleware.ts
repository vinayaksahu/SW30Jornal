import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth-config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/accounts/:path*',
    '/trades/:path*',
    '/rules/:path*',
    '/strategies/:path*',
    '/calendar/:path*',
    '/analytics/:path*',
    '/clocks/:path*',
    '/news/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
