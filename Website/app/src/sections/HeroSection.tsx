import { useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  className?: string;
}

const HeroSection = ({ className = '' }: HeroSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);

  // Auto-play entrance animation on load
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Photo card entrance
      tl.fromTo(
        photoRef.current,
        { opacity: 0, x: '-12vw', scale: 0.96 },
        { opacity: 1, x: 0, scale: 1, duration: 0.8 },
        0
      );

      // Content entrance
      tl.fromTo(
        contentRef.current?.querySelectorAll('.animate-item') || [],
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
        0.2
      );

      // Shapes entrance
      tl.fromTo(
        shapesRef.current?.querySelectorAll('.shape') || [],
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05 },
        0.3
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Scroll-driven exit animation
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
          onLeaveBack: () => {
            // Reset all elements to visible when scrolling back
            gsap.set(photoRef.current, { opacity: 1, x: 0, rotate: 0 });
            gsap.set(contentRef.current?.querySelectorAll('.animate-item') || [], {
              opacity: 1,
              x: 0,
            });
            gsap.set(shapesRef.current?.querySelectorAll('.shape') || [], {
              opacity: 1,
              x: 0,
              y: 0,
            });
          },
        },
      });

      // ENTRANCE (0-30%): Hold - already visible from load animation
      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        photoRef.current,
        { x: 0, opacity: 1, rotate: 0 },
        { x: '-55vw', opacity: 0, rotate: -3, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        contentRef.current?.querySelectorAll('.animate-item') || [],
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0, stagger: 0.02, ease: 'power2.in' },
        0.7
      );

      // Shapes scatter
      const shapes = shapesRef.current?.querySelectorAll('.shape');
      if (shapes) {
        shapes.forEach((shape, i) => {
          const directions = [
            { x: '-10vw', y: '35vh' },
            { x: '12vw', y: '-25vh' },
            { x: '-8vw', y: '-15vh' },
            { x: '15vw', y: '20vh' },
            { x: '-12vw', y: '10vh' },
            { x: '10vw', y: '30vh' },
          ];
          scrollTl.fromTo(
            shape,
            { x: 0, y: 0, opacity: 1 },
            {
              x: directions[i]?.x || '10vw',
              y: directions[i]?.y || '20vh',
              opacity: 0,
              ease: 'power2.in',
            },
            0.72 + i * 0.02
          );
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToDownload = () => {
    const element = document.getElementById('download');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className={`section-pinned bg-violet ${className}`}
    >
      {/* Floating geometric shapes */}
      <div ref={shapesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Yellow circle (large, bottom-left) */}
        <div
          className="shape absolute bg-yellow rounded-full"
          style={{
            left: '-6vw',
            top: '62vh',
            width: '22vw',
            height: '22vw',
          }}
        />
        {/* Coral quarter-circle (top-right) */}
        <div
          className="shape absolute bg-coral"
          style={{
            right: '-10vw',
            top: '-10vw',
            width: '28vw',
            height: '28vw',
            borderRadius: '0 0 0 100%',
          }}
        />
        {/* Yellow donut */}
        <div
          className="shape absolute"
          style={{
            left: '44vw',
            top: '12vh',
            width: '7vw',
            height: '7vw',
          }}
        >
          <div className="w-full h-full rounded-full border-[12px] border-yellow" />
        </div>
        {/* Coral pill */}
        <div
          className="shape absolute bg-coral rounded-full"
          style={{
            left: '54vw',
            top: '14vh',
            width: '3vw',
            height: '10vw',
            transform: 'rotate(12deg)',
          }}
        />
        {/* Yellow triangle */}
        <div
          className="shape absolute"
          style={{
            left: '34vw',
            top: '74vh',
            width: 0,
            height: 0,
            borderLeft: '3vw solid transparent',
            borderRight: '3vw solid transparent',
            borderBottom: '5vw solid #FFD600',
          }}
        />
        {/* Coral semicircle (bottom-left) */}
        <div
          className="shape absolute bg-coral"
          style={{
            left: '18vw',
            top: '82vh',
            width: '8vw',
            height: '4vw',
            borderRadius: '4vw 4vw 0 0',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full h-full flex items-center">
        <div className="w-full px-6 lg:px-12 xl:px-20 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Photo card */}
          <div
            ref={photoRef}
            className="w-full lg:w-[38vw] lg:max-w-[520px] flex-shrink-0"
          >
            <div className="relative rounded-[34px] overflow-hidden shadow-card">
              <img
                src="/images/hero_child_reading.jpg"
                alt="Child reading with Alex"
                className="w-full h-auto aspect-[3/4] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-violet/30 to-violet/50 pointer-events-none" />
            </div>
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className="flex-1 text-center lg:text-left max-w-xl lg:max-w-none"
          >
            <div className="animate-item inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-yellow" />
              <span className="font-label text-xs text-white/90">
                Powered by IBM Watson & Granite AI
              </span>
            </div>

            <h1 className="animate-item font-display text-4xl sm:text-5xl lg:text-[clamp(44px,5.2vw,78px)] font-bold text-white leading-tight mb-6">
              Turn reading
              <br />
              practice into play.
            </h1>

            <p className="animate-item text-lg lg:text-xl text-white/80 mb-8 max-w-md mx-auto lg:mx-0">
              Alex listens, encourages, and grows with your child—one story at a
              time.
            </p>

            <div className="animate-item flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-4">
              <button onClick={scrollToDownload} className="btn-primary flex items-center gap-2">
                Get the app
                <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={scrollToHowItWorks} className="btn-secondary">
                See how it works
              </button>
            </div>

            <p className="animate-item text-sm text-white/60">
              Free to try. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
