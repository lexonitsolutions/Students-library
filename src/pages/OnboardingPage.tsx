import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingSlides } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';
import { Button } from '../components/ui/Button';

export function OnboardingPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const isLastSlide = slideIndex === onboardingSlides.length - 1;

  const handleContinue = () => {
    if (isLastSlide) {
      setShowGetStarted(true);
    } else {
      setSlideIndex((index) => index + 1);
    }
  };

  const handleSkip = () => setShowGetStarted(true);

  const finishOnboarding = (destination: '/login') => {
    completeOnboarding();
    navigate(destination);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-8 sm:px-6">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-card-hover sm:min-h-[720px]">
        <AnimatePresence mode="wait">
          {!showGetStarted ? (
            <motion.div
              key="slides"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col p-6 sm:p-8"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-label-md text-on-surface-variant cursor-pointer"
                >
                  Skip
                </button>
              </div>

              <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideIndex}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="flex flex-col items-center"
                  >
                    <div className="mb-8 flex h-56 w-56 items-center justify-center rounded-2xl bg-primary-container/10">
                      <img
                        src="/images/onboarding-illustration.png"
                        alt=""
                        className="h-40 w-40 object-contain"
                      />
                    </div>
                    <h1 className="text-headline-lg-mobile text-on-surface">
                      {onboardingSlides[slideIndex].title}
                    </h1>
                    <p className="mt-3 text-body-md text-on-surface-variant">
                      {onboardingSlides[slideIndex].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2">
                {onboardingSlides.map((slide, index) => (
                  <span
                    key={slide.id}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-200',
                      index === slideIndex ? 'w-6 bg-primary' : 'w-1.5 bg-outline-variant',
                    )}
                  />
                ))}
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="mt-8"
                icon={<ArrowRight size={18} />}
                iconPosition="right"
                onClick={handleContinue}
              >
                Continue
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="get-started"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-1 flex-col p-6 sm:p-8"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
                  <BookOpen size={18} />
                </div>
                <span className="text-headline-md text-on-surface">Lexon</span>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-8 flex h-56 w-56 items-center justify-center rounded-2xl bg-primary-container/10">
                  <img src="/images/onboarding-illustration.png" alt="" className="h-40 w-40 object-contain" />
                </div>
                <h1 className="text-headline-lg-mobile text-on-surface">
                  Get Started with Your Study Journey
                </h1>
                <p className="mt-3 text-body-md text-on-surface-variant">
                  Discover, share, and access study materials from students like you.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="primary" size="lg" fullWidth onClick={() => finishOnboarding('/login')}>
                  Get Started
                </Button>
                <Button variant="ghost" size="lg" fullWidth onClick={() => finishOnboarding('/login')}>
                  I already have an account
                </Button>
              </div>

              <p className="mt-8 text-center text-label-sm tracking-widest text-outline">
                LEARN &bull; SHARE &bull; GROW
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default OnboardingPage;
