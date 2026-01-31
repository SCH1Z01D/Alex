import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Highlighter, HelpCircle, PartyPopper, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface LiveSessionSectionProps {
  className?: string;
}

const features = [
  'Real-time word highlighting',
  'Gentle prompts when stuck',
  'Celebration that builds confidence',
];

const LiveSessionSection = ({ className = '' }: LiveSessionSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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
      // Left media panel from left
      scrollTl.fromTo(
        mediaRef.current,
        { x: '-70vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, ease: 'none' },
        0
      );

      // Right coral panel from right
      scrollTl.fromTo(
        panelRef.current,
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

      // Decoratives
      scrollTl.fromTo(
        decorRef.current?.querySelectorAll('.decor-item') || [],
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.03, ease: 'none' },
        0
      );

      // Donut drop
      const donut = decorRef.current?.querySelector('.decor-donut');
      if (donut) {
        scrollTl.fromTo(
          donut,
          { y: '-10vh', opacity: 0 },
          { y: 0, opacity: 1, ease: 'none' },
          0.08
        );
      }

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        mediaRef.current,
        { x: 0, opacity: 1 },
        { x: '-45vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        panelRef.current,
        { x: 0, opacity: 1 },
        { x: '45vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        decorRef.current?.querySelectorAll('.decor-item, .decor-donut') || [],
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
      id="features"
      className={`section-pinned bg-violet ${className}`}
    >
      {/* Decoratives */}
      <div ref={decorRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Yellow circle bottom-left */}
        <div
          className="decor-item absolute bg-yellow rounded-full"
          style={{
            left: '-8vw',
            top: '72vh',
            width: '22vw',
            height: '22vw',
          }}
        />
        {/* Coral quarter-circle top-right */}
        <div
          className="decor-item absolute bg-coral"
          style={{
            right: '-10vw',
            top: '-10vw',
            width: '26vw',
            height: '26vw',
            borderRadius: '0 0 0 100%',
          }}
        />
        {/* Yellow donut */}
        <div
          className="decor-donut absolute"
          style={{
            left: '52vw',
            top: '10vh',
            width: '6vw',
            height: '6vw',
          }}
        >
          <div className="w-full h-full rounded-full border-[10px] border-yellow" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full h-full flex items-center">
        <div className="w-full px-6 lg:px-12 xl:px-20 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left media panel */}
          <div
            ref={mediaRef}
            className="w-full lg:w-[46vw] lg:max-w-[600px] flex-shrink-0"
          >
            <div className="relative rounded-[36px] overflow-hidden shadow-card">
              <img
                src="/images/live_session_child.jpg"
                alt="Child using Alex for reading practice"
                className="w-full h-auto aspect-[3/4] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-violet/30 to-violet/50 pointer-events-none" />
            </div>
          </div>

          {/* Right coral panel */}
          <div
            ref={panelRef}
            className="flex-1 w-full lg:w-auto"
          >
            <div className="card-coral max-w-lg mx-auto lg:mx-0">
              <span className="animate-text badge-yellow inline-block w-fit mb-6">
                Live Session
              </span>
              <h2 className="animate-text font-display text-3xl sm:text-4xl lg:text-[clamp(32px,3.6vw,56px)] font-bold text-white mb-6">
                Reads along.
                <br />
                Cheers you on.
              </h2>
              <p className="animate-text text-white/80 text-lg mb-8">
                Alex highlights words as your child reads and celebrates progress
                with stickers and encouragement.
              </p>

              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="animate-text flex items-center gap-3"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow/20 rounded-full flex-shrink-0">
                      {index === 0 && <Highlighter className="w-4 h-4 text-yellow" />}
                      {index === 1 && <HelpCircle className="w-4 h-4 text-yellow" />}
                      {index === 2 && <PartyPopper className="w-4 h-4 text-yellow" />}
                    </div>
                    <span className="text-white/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="animate-text btn-primary flex items-center gap-2">
                Try a session
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveSessionSection;
