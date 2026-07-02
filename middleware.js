import { NextResponse } from 'next/server';
import { verifyToken } from './src/lib/jwt'; // Use relative path to work within middleware environment
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies
  const tokenCookie = request.cookies.get('rentify_token');
  const token = tokenCookie ? tokenCookie.value : null;
  
  // Verify token
  let user = null;
  if (token) {
    user = await verifyToken(token);
  }
  
  // Protect routes based on role
  if (pathname.startsWith('/tenant')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (user.role !== 'tenant' && user.role !== 'admin') {
      const dest = user.role === 'landlord' ? '/landlord' : '/admin';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }
  
  if (pathname.startsWith('/landlord')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (user.role !== 'landlord' && user.role !== 'admin') {
      const dest = user.role === 'tenant' ? '/tenant' : '/admin';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }
  
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (user.role !== 'admin') {
      const dest = user.role === 'tenant' ? '/tenant' : '/landlord';
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }
  
  // If user is already logged in, redirect away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const dest = user.role === 'tenant' ? '/tenant' : user.role === 'landlord' ? '/landlord' : '/admin';
    return NextResponse.redirect(new URL(dest, request.url));
  }
  
  return NextResponse.next();
}
export const config = {
  matcher: [
    '/tenant/:path*',
    '/landlord/:path*',
    '/admin/:path*',
    '/login',
    '/register'
  ],
};