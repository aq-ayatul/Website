import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trailfolk SG — Find your next green escape',
  description: 'Discover Singapore hiking trails, save your favourites, and plan a walking route at your own pace with OneMap and NParks trail information.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en-SG"><body>{children}</body></html>;
}
