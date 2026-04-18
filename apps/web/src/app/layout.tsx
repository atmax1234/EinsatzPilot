import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EinsatzPilot',
  description: 'Plattformgrundlage fuer EinsatzPilot',
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
