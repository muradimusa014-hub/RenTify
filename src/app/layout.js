import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Rentify - Zaria Property Rental Marketplace',
  description: 'Connect with landlords, find beautiful apartments, and secure rental bookings in Zaria, Nigeria.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              {children}
            </main>
            <footer style={{ borderTop: '1px solid var(--border)', padding: '2rem 1.5rem', textAlign: 'center', background: '#fff' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                <p>&copy; {new Date().getFullYear()} Rentify. Secure Property Rentals in Zaria, Nigeria.</p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>Samaru • Sabon Gari • Gyellesu • Tudun Wada • Zaria City • GRA • Kongo</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
