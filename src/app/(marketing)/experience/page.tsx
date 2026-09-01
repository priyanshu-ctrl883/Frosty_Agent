import ExperienceClient from './ExperienceClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Frosty Agent Experience — See it in Action',
  description: 'Experience the lightning-fast Frosty Agent AI firsthand.',
};

export default function ExperiencePage() {
  return <ExperienceClient />;
}
