import type {Metadata, Viewport} from 'next';

import {Inter} from 'next/font/google';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './globals.css';

const inter = Inter({subsets: ['latin']});

const description = 'CachyOS Builder Dashboard';
const name = 'CachyOS Builder Dashboard';

export const viewport: Viewport = {
  colorScheme: 'dark',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FFFFFF',
  userScalable: false,
  width: 'device-width',
};

export const metadata: Metadata = {
  applicationName: name,
  description,
  openGraph: {
    description,
    emails: ['admin@cachyos.org', 'admin@soulharsh007.dev'],
    locale: 'en_US',
    siteName: name,
    title: name,
    type: 'website',
  },
  title: name,
  twitter: {
    description,
    title: name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={
          inter.className +
          ' bg-tremor-background dark:bg-dark-tremor-background'
        }
      >
        <ToastContainer
          autoClose={5000}
          newestOnTop
          pauseOnFocusLoss
          pauseOnHover
          rtl={false}
          theme="colored"
        />
        {children}
      </body>
    </html>
  );
}
