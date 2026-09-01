import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <main className='min-h-screen bg-white flex items-center justify-center px-6 py-20'>
      <div className='max-w-5xl w-full flex flex-col md:flex-row items-center gap-8 md:gap-16'>

        {/* Left: Robot Illustration */}
        <div className='w-64 h-64 md:w-[380px] md:h-[380px] relative shrink-0'>
          <Image
            src='/images/frosty-404.jpg'
            alt='Frosty robot looking confused'
            fill
            className='object-contain'
            priority
          />
        </div>

        {/* Right: Content */}
        <div className='text-center md:text-left'>
          <h1 className='text-7xl md:text-8xl font-black text-[#0396A6]/25 tracking-tighter mb-2 leading-none'>
            404
          </h1>
          <h2 className='text-3xl md:text-4xl font-extrabold text-stone-900 mb-4'>
            Oops! Frosty got lost.<span className='text-[#F4845F]'>&#10022;</span>
          </h2>
          <p className='text-base md:text-lg text-stone-500 mb-10 leading-relaxed max-w-md'>
            The page you&apos;re looking for doesn&apos;t exist
            or has been moved. Let&apos;s get you{' '}
            <span className='text-[#0396A6] font-semibold'>back on track!</span>
          </p>

          <div className='flex flex-col sm:flex-row items-center gap-4'>
            <Link
              href='/'
              className='flex items-center justify-center gap-2.5 bg-[#0396A6] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#027D8A] hover:-translate-y-0.5 transition-all shadow-lg shadow-[#0396A6]/20 text-[15px]'
            >
              <Home className='w-5 h-5' />
              Return Home
            </Link>

            <Link
              href='/contact'
              className='flex items-center justify-center gap-2 bg-white text-stone-700 px-8 py-3.5 rounded-xl font-semibold border border-stone-200 hover:bg-stone-50 hover:-translate-y-0.5 transition-all shadow-sm text-[15px]'
            >
              Contact Support
              <ArrowRight className='w-4 h-4 text-stone-400' />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
