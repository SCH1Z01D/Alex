import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, Sparkles, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface PricingSectionProps {
  className?: string;
}

const plans = [
  {
    name: 'Free',
    price: 'Free',
    description: 'Perfect for trying Alex',
    features: ['5 stories / month', 'Basic progress', 'Stickers & badges'],
    cta: 'Get started',
    highlighted: false,
    icon: null,
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    description: 'Best for growing readers',
    features: [
      'Unlimited stories',
      'Smart library',
      'Advanced progress',
      'Priority support',
    ],
    cta: 'Start free trial',
    highlighted: true,
    icon: Sparkles,
  },
  {
    name: 'Family',
    price: '$14.99',
    period: '/month',
    description: 'For multiple children',
    features: [
      'Up to 4 profiles',
      'Parent dashboard',
      'Shared library',
      'All Premium features',
    ],
    cta: 'Choose Family',
    highlighted: false,
    icon: Users,
  },
];

const PricingSection = ({ className = '' }: PricingSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        headerRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards animation
      const cards = cardsRef.current?.querySelectorAll('.pricing-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { y: 60, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="plans"
      className={`relative bg-violet py-20 lg:py-32 ${className}`}
    >
      <div className="w-full px-6 lg:px-12 xl:px-20">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(32px,3.6vw,56px)] font-bold text-white mb-4">
            Choose what works for your family.
          </h2>
          <p className="text-white/70 text-lg max-w-md mx-auto">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        {/* Pricing cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto"
        >
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-card relative rounded-[28px] p-6 lg:p-8 ${
                plan.highlighted
                  ? 'bg-coral text-white shadow-card scale-105 z-10'
                  : 'bg-white text-gray-800'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-yellow text-violet font-label text-xs font-bold px-4 py-1.5 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {plan.icon && (
                    <plan.icon
                      className={`w-5 h-5 ${
                        plan.highlighted ? 'text-yellow' : 'text-coral'
                      }`}
                    />
                  )}
                  <h3
                    className={`font-display text-xl font-bold ${
                      plan.highlighted ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {plan.name}
                  </h3>
                </div>
                <p
                  className={`text-sm ${
                    plan.highlighted ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span
                  className={`font-display text-4xl font-bold ${
                    plan.highlighted ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span
                    className={`text-sm ${
                      plan.highlighted ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {plan.period}
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full ${
                        plan.highlighted ? 'bg-yellow/20' : 'bg-coral/10'
                      }`}
                    >
                      <Check
                        className={`w-3 h-3 ${
                          plan.highlighted ? 'text-yellow' : 'text-coral'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm ${
                        plan.highlighted ? 'text-white/90' : 'text-gray-600'
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-6 rounded-full font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                  plan.highlighted
                    ? 'bg-yellow text-violet hover:shadow-lg'
                    : 'bg-violet text-white hover:bg-violet-dark'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <p className="text-center text-white/50 text-sm mt-10">
          All plans include core safety features. Cancel anytime.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
