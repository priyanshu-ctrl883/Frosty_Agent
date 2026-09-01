import LandingPageClient from './LandingPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'FrostyAgent — Every Enquiry Handled, Before & After the Sale',
    description: 'AI customer agent for your website and WhatsApp with one shared memory. Answers instantly, qualifies leads, books meetings, sends GST quotes.',
};

export default function LandingPage() {
    return (
        <>
            <h1 className="sr-only">AI customer agent for presales, after sales and lead management</h1>
            <LandingPageClient />
        </>
    );
}


