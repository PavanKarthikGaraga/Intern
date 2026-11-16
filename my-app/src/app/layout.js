// 'use client';
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';
import { Lexend } from 'next/font/google';
import ChunkErrorGuard from './components/ChunkErrorGuard';

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-lexend',
});

export const metadata = {
  title: {
    default: "Social Internship | KL University",
    template: "%s | Social Internship KLU",
  },
  description:
    "KL University's Social Internship programme — register for a slot, submit daily reports and track evaluation for community-engagement internships.",
  applicationName: "Social Internship KLU",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#970003",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={lexend.variable}>
      <body suppressHydrationWarning>
        <ChunkErrorGuard />
        <AuthProvider>
          {children}
        </AuthProvider>
        {/* Offset keeps toasts below the 60px dashboard header so they never cover Logout */}
        <Toaster
          position="top-right"
          containerStyle={{ top: 72 }}
          toastOptions={{
            style: { fontSize: '0.875rem', borderRadius: '10px', boxShadow: '0 8px 24px rgba(16,24,40,0.12)' },
          }}
        />
      </body>
    </html>
  );
}
