import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, Mic, Trophy } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HowItWorksSectionProps {
  className?: string;
}

const steps = [
  {
    number: '1',
    title: 'Choose a story',
    description: 'From our library or add your own.',
    image: '/images/step1_choose_book.jpg',
    icon: BookOpen,
  },
  {
    number: '2',
    title: 'Read out loud',
    description: 'Alex listens and follows along.',
    image: '/images/step2_read_aloud.jpg',
    icon: Mic,
  },
  {
    number: '3',
    title: 'Earn rewards',
    description: 'Stickers, badges, and new chapters unlock.',
    image: '/images/step3_celebrate.jpg',
    icon: Trophy,
  },
];

const HowItWorksSection = ({ className = '' }: HowItWorksSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
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
      // Coral panel from left
      scrollTl.fromTo(
        panelRef.current,
        { x: '-60vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      // Text content
      scrollTl.fromTo(
        panelRef.current?.querySelectorAll('.animate-text') || [],
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.02, ease: 'none' },
        0.08
      );

      // Step cards from right
      const cards = cardsRef.current?.querySelectorAll('.step-card');
      scrollTl.fromTo(
        cards || [],
        { x: '60vw', opacity: 0, scale: 0.98 },
        { x: 0, opacity: 1, scale: 1, stagger: 0.025, ease: 'none' },
        0.05
      );

      // Step badges
      scrollTl.fromTo(
        cardsRef.current?.querySelectorAll('.step-badge') || [],
        { scale: 0.6, rotate: -12, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, stagger: 0.02, ease: 'none' },
        0.12
      );

      // Decoratives
      scrollTl.fromTo(
        decorRef.current?.querySelectorAll('.decor-item') || [],
        { y: (i) => (i === 0 ? '-12vh' : '12vh'), opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.03, ease: 'none' },
        0
      );

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        panelRef.current,
        { x: 0, opacity: 1 },
        { x: '-40vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        cards || [],
        { x: 0, opacity: 1 },
        { x: '40vw', opacity: 0, stagger: 0.02, ease: 'power2.in' },
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
      id="how-it-works"
      className={`section-pinned bg-violet ${className}`}
    >
      {/* Decoratives */}
      <div ref={decorRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Yellow donut */}
        <div
          className="decor-item absolute"
          style={{
            left: '42vw',
            top: '8vh',
            width: '6vw',
            height: '6vw',
          }}
        >
          <div className="w-full h-full rounded-full border-[10px] border-yellow" />
        </div>
        {/* Coral semicircle */}
        <div
          className="decor-item absolute bg-coral"
          style={{
            right: '6vw',
            top: '82vh',
            width: '10vw',
            height: '5vw',
            borderRadius: '5vw 5vw 0 0',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full h-full flex items-center">
        <div className="w-full px-6 lg:px-12 xl:px-20 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left coral panel */}
          <div
            ref={panelRef}
            className="w-full lg:w-[34vw] lg:max-w-[480px] flex-shrink-0"
          >
            <div className="card-coral h-auto lg:h-[64vh] flex flex-col justify-center">
              <span className="animate-text badge-yellow inline-block w-fit mb-6">
                How It Works
              </span>
              <h2 className="animate-text font-display text-3xl sm:text-4xl lg:text-[clamp(32px,3.6vw,56px)] font-bold text-white mb-6">
                Three steps
                <br />
                to storytime.
              </h2>
              <p className="animate-text text-white/80 text-lg">
                Pick a book, read aloud, and get cheers that keep kids turning
                pages.
              </p>
            </div>
          </div>

          {/* Right step cards */}
          <div
            ref={cardsRef}
            className="flex-1 w-full lg:w-auto flex flex-col gap-4"
          >
            {steps.map((step, index) => (
              <div
                key={index}
                className="step-card relative rounded-[24px] overflow-hidden shadow-card bg-white/5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Image thumbnail */}
                  <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 rounded-[16px] overflow-hidden">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-violet/30" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="step-badge flex items-center justify-center w-8 h-8 bg-yellow text-violet font-bold rounded-full text-sm">
                        {step.number}
                      </span>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-white/70 text-sm sm:text-base">
                      {step.description}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/10 rounded-full flex-shrink-0">
                    <step.icon className="w-5 h-5 text-yellow" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
