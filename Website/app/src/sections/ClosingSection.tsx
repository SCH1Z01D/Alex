import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Mail, Instagram, Youtube, Twitter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

gsap.registerPlugin(ScrollTrigger);

interface ClosingSectionProps {
  className?: string;
}

const ClosingSection = ({ className = '' }: ClosingSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState({ title: '', description: '' });

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Card animation
      gsap.fromTo(
        cardRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Footer animation
      gsap.fromTo(
        footerRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setDialogMessage({
        title: 'Thank you!',
        description: `We've added ${email} to our early access list. We'll be in touch soon!`,
      });
      setShowDialog(true);
      setEmail('');
    }
  };

  const handleDownloadClick = () => {
    setDialogMessage({
      title: 'Coming Soon!',
      description: 'The Alex app is launching soon. Join our early access list to be the first to know when the APK is available for download!',
    });
    setShowDialog(true);
  };

  return (
    <section
      ref={sectionRef}
      id="download"
      className={`relative bg-violet pt-10 pb-0 ${className}`}
    >
      <div className="w-full px-6 lg:px-12 xl:px-20">
        {/* Closing card */}
        <div
          ref={cardRef}
          className="card-coral max-w-4xl mx-auto text-center py-12 lg:py-16 px-6 lg:px-12 mb-16"
        >
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[clamp(32px,3.6vw,56px)] font-bold text-white mb-6">
            Ready to make reading the best part of the day?
          </h2>

          {/* APK Download Button */}
          <button
            onClick={handleDownloadClick}
            className="btn-primary inline-flex items-center gap-2 mb-8 text-lg px-10 py-5"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0225 3.503C15.5902 8.4796 13.8532 8.1772 12 8.1772c-1.8532 0-3.5902.3024-5.1367.8455l-2.0225-3.503a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589.3432 18.6617h23.3136c0-4.0028-2.3457-7.475-5.7755-9.3403"/>
            </svg>
            Download APK
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="max-w-md mx-auto">
            <p className="text-white/70 mb-4">
              Or get early access updates via email
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-yellow/50"
                />
              </div>
              <button
                type="submit"
                className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Get early access
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <p className="text-white/50 text-sm mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer
          ref={footerRef}
          className="border-t border-white/10 pt-10 pb-8"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Logo and links */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <span className="font-display text-2xl font-bold text-white">
                Alex
              </span>
              <nav className="flex items-center gap-6">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setDialogMessage({
                      title: 'Privacy Policy',
                      description: 'Our privacy policy is coming soon. We are committed to protecting your child\'s data and privacy.',
                    });
                    setShowDialog(true);
                  }}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setDialogMessage({
                      title: 'Terms of Service',
                      description: 'Our terms of service are coming soon. We prioritize child safety and COPPA compliance.',
                    });
                    setShowDialog(true);
                  }}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Terms
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setDialogMessage({
                      title: 'Support',
                      description: 'Our support team is here to help! Contact us at support@alexapp.com',
                    });
                    setShowDialog(true);
                  }}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Support
                </a>
              </nav>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setDialogMessage({
                    title: 'Instagram',
                    description: 'Follow us @alexapp for reading tips and updates!',
                  });
                  setShowDialog(true);
                }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setDialogMessage({
                    title: 'YouTube',
                    description: 'Subscribe to our YouTube channel for tutorials and storytime videos!',
                  });
                  setShowDialog(true);
                }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setDialogMessage({
                    title: 'Twitter',
                    description: 'Follow us @alexapp for the latest news and updates!',
                  });
                  setShowDialog(true);
                }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center mt-8 pt-6 border-t border-white/5">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Alex App Ltd. All rights reserved.
            </p>
            <p className="text-white/30 text-xs mt-2">
              Powered by IBM Watson & Granite AI
            </p>
          </div>
        </footer>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white text-gray-800 rounded-[24px] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              {dialogMessage.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {dialogMessage.description}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ClosingSection;
