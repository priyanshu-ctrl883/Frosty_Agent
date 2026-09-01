import FaqClient from './FaqClient';
import { StructuredData } from '@/components/StructuredData';

export const metadata = {
    title: 'Frosty Agent FAQ — Everything You Need to Know',
    description: 'Find answers to all your questions about Frosty Agent, the AI Sales Assistant for Web and WhatsApp.',
};

const faqSchema = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Can Frosty handle both my website and WhatsApp?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Frosty runs on your website and on WhatsApp at the same time, using one shared memory. If someone starts a chat on your site and later messages you on WhatsApp, Frosty remembers the earlier conversation, so the customer never has to repeat themselves."}}, {"@type": "Question", "name": "Can Frosty qualify leads and book meetings on its own?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Frosty asks the right questions to understand budget, timeline, and intent, then tags each lead as warm or hot based on rules you set."}}, {"@type": "Question", "name": "Does Frosty really work 24/7?", "acceptedAnswer": {"@type": "Answer", "text": "Yes. Frosty answers the moment a message comes in, at any hour, including nights, weekends, and holidays."}}]};

export default function FAQPage() {
    return (
        <>
            <StructuredData data={faqSchema} />
            <FaqClient />
        </>
    );
}

