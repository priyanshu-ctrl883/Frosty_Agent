import ContactClient from './ContactClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Frosty Agent — Get in Touch',
    description: 'Reach out to the Frosty Agent team to automate your business.',
};

export default function ContactPage() {
    return (
        <>
            
            <ContactClient />
        </>
    );
}
