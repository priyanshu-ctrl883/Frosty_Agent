import type { Metadata } from 'next';
import './FrostyPage.css';
import { StructuredData } from '@/components/StructuredData';
import { LenisProvider } from '@/components/LenisProvider';

export const metadata: Metadata = {
  metadataBase: new URL('https://frostyagent.com'),
  title: 'FrostyAgent — Every Enquiry Handled, Before & After the Sale',
  description:
    'AI customer agent for your website and WhatsApp with one shared memory. Answers instantly, qualifies leads, books meetings, sends GST quotes.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
  openGraph: {
    title: 'FrostyAgent — Every Enquiry Handled, Before & After the Sale',
    description:
      'AI customer agent for your website and WhatsApp with one shared memory. Answers instantly, qualifies leads, books meetings, sends GST quotes.',
    url: 'https://frostyagent.com',
    siteName: 'FrostyAgent',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FrostyAgent — Every Enquiry Handled, Before & After the Sale',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FrostyAgent — Every Enquiry Handled, Before & After the Sale',
    description:
      'AI customer agent for your website and WhatsApp with one shared memory. Answers instantly, qualifies leads, books meetings, sends GST quotes.',
    images: ['/og-image.png'],
  },
};


const orgSchema = {"@context": "https://schema.org", "@type": "Organization", "name": "Frosty Agent", "url": "https://frostyagent.com", "logo": "https://frostyagent.com/icon.svg", "foundingDate": "2026", "address": {"@type": "PostalAddress", "streetAddress": "Frostrek HQ", "addressLocality": "New Delhi", "addressCountry": "IN"}};
const softwareSchema = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Frosty Agent", "applicationCategory": "BusinessApplication", "operatingSystem": "Web, WhatsApp"};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LenisProvider>
      <StructuredData data={orgSchema} />
      <StructuredData data={softwareSchema} />
      {children}
    </LenisProvider>
  );
}



