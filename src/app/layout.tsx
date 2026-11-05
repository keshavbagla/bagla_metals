import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Bagla Metal Traders',
  description: 'Wholesale & Retail SS Utensils — Hathras',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-steel-50 text-steel-800">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
