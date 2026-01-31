import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Heart, Plus, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface SmartLibrarySectionProps {
  className?: string;
}

const features = [
  'Level-matched suggestions',
  'Topics they love (dinosaurs, space, animals)',
  'Add your own books in seconds',
];

const SmartLibrarySection = ({ className = '' }: SmartLibrarySectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const decorRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0-30%)
      // Left coral panel from left
      scrollTl.fromTo(
        panelRef.current,
        { x: '-70vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      // Right media panel from right
      scrollTl.fromTo(
        mediaRef.current,
        { x: '70vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.06
      );

      // Text content
      scrollTl.fromTo(
        panelRef.current?.querySelectorAll('.animate-text') || [],
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.02, ease: 'none' },
        0.12
      );

      // Donut
      const donut = decorRef.current?.querySelector('.decor-donut');
      if (donut) {
        scrollTl.fromTo(
          donut,
          { y: '-12vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.08
        );
      }

      // Semicircle
      const semicircle = decorRef.current?.querySelector('.decor-semicircle');
      if (semicircle) {
        scrollTl.fromTo(
          semicircle,
          { y: '12vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.1
        );
      }

      // Triangle
      const triangle = decorRef.current?.querySelector('.decor-triangle');
      if (triangle) {
        scrollTl.fromTo(
          triangle,
          { scale: 0.8, rotate: -10, opacity: 0 },
          { scale: 1, rotate: 0, opacity: 1, ease: 'none' },
          0.12
        );
      }

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        panelRef.current,
        { x: 0, opacity: 1 },
        { x: '-45vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        mediaRef.current,
        { x: 0, opacity: 1 },
        { x: '45vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        decorRef.current?.querySelectorAll('.decor-item') || [],
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.75
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`section-pinned bg-violet ${className}`}
    >
      {/* Decoratives */}
      <div ref={decorRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Yellow donut top-left */}
        <div
          className="decor-donut decor-item absolute"
          style={{
            left: '34vw',
            top: '10vh',
            width: '6vw',
            height: '6vw',
          }}
        >
          <div className="w-full h-full rounded-full border-[10px] border-yellow" />
        </div>
        {/* Coral semicircle bottom-right */}
        <div
          className="decor-semicircle decor-item absolute bg-coral"
          style={{
            right: '6vw',
            top: '80vh',
            width: '10vw',
            height: '5vw',
            borderRadius: '5vw 5vw 0 0',
          }}
        />
        {/* Yellow triangle */}
        <div
          className="decor-triangle decor-item absolute"
          style={{
            left: '44vw',
            top: '54vh',
            width: 0,
            height: 0,
            borderLeft: '2.5vw solid transparent',
            borderRight: '2.5vw solid transparent',
            borderBottom: '4vw solid #FFD600',
            transform: 'rotate(15deg)',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full h-full flex items-center">
        <div className="w-full px-6 lg:px-12 xl:px-20 flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-12">
          {/* Right media panel */}
          <div
            ref={mediaRef}
            className="w-full lg:w-[44vw] lg:max-w-[580px] flex-shrink-0"
          >
            <div className="relative rounded-[36px] overflow-hidden shadow-card">
              <img
                src="/images/library_books.jpg"
                alt="Smart library with children's books"
                className="w-full h-auto aspect-[3/4] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-violet/30 to-violet/50 pointer-events-none" />
            </div>
          </div>

          {/* Left coral panel */}
          <div
            ref={panelRef}
            className="flex-1 w-full lg:w-auto"
          >
            <div className="card-coral max-w-lg mx-auto lg:mx-0">
              <span className="animate-text badge-yellow inline-block w-fit mb-6">
                Smart Library
              </span>
              <h2 className="animate-text font-display text-3xl sm:text-4xl lg:text-[clamp(32px,3.6vw,56px)] font-bold text-white mb-6">
                A library that fits
                <br />
                your child.
              </h2>
              <p className="animate-text text-white/80 text-lg mb-8">
                Stories adapt to their level, interests, and pace—so every
                session feels just right.
              </p>

              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="animate-text flex items-center gap-3"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow/20 rounded-full flex-shrink-0">
                      {index === 0 && <Search className="w-4 h-4 text-yellow" />}
                      {index === 1 && <Heart className="w-4 h-4 text-yellow" />}
                      {index === 2 && <Plus className="w-4 h-4 text-yellow" />}
                    </div>
                    <span className="text-white/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="animate-text btn-primary flex items-center gap-2">
                Explore the library
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmartLibrarySection;
