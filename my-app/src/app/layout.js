// 'use client';
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata = {
  title: "Social Internship KLU",
  description: "A platform for managing social internships and community engagement",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
