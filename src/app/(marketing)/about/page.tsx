import AboutClient from './AboutClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Frosty Agent — The Team Behind the AI',
    description: 'Learn how Frosty Agent is building the future of autonomous lead conversion.',
};

export default function AboutPage() {
    return (
        <>
            
            <AboutClient />
        </>
    );
}
