import { motion } from 'framer-motion';
import { ArrowRight, Mail, Smartphone } from 'lucide-react';
import { type FormEvent, useState, useRef, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const OTP_LENGTH = 6;

export function OtpVerificationPage() {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifySignupOtp, verifyMobileOtp, resendSignupOtp, sendMobileOtp } = useAuth();
  const target: string = location.state?.target || 'your email address';
  const type: 'email' | 'mobile' = location.state?.type || 'email';
  const otpKind: 'signup' | 'sms' = location.state?.otpKind || (type === 'mobile' ? 'sms' : 'signup');

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== '') {
      if (index < OTP_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return;

    setError(null);
    setIsSubmitting(true);
    const { error: verifyError } =
      otpKind === 'sms' ? await verifyMobileOtp(target, code) : await verifySignupOtp(target, code);
    setIsSubmitting(false);

    if (verifyError) {
      setError(verifyError);
      return;
    }
    navigate('/', { replace: true });
  };

  const handleResend = async () => {
    setError(null);
    const { error: resendError } = otpKind === 'sms' ? await sendMobileOtp(target) : await resendSignupOtp(target);
    if (resendError) setError(resendError);
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-white border-r border-gray-100 relative overflow-hidden">
        <div className="flex items-center gap-2 z-10">
          <div className="font-bold text-xl tracking-tight text-gray-900 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">L</span>
            Lexon
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
           <div className="w-full max-w-md aspect-video bg-gray-50 rounded-xl border border-gray-100 shadow-sm mb-12 flex items-center justify-center overflow-hidden">
              <div className="grid grid-cols-2 gap-4 p-8 w-full opacity-60">
                 <div className="h-32 bg-indigo-100 rounded-lg shadow-sm"></div>
                 <div className="space-y-4">
                   <div className="h-16 bg-blue-100 rounded-lg shadow-sm"></div>
                   <div className="h-12 bg-emerald-100 rounded-lg shadow-sm"></div>
                 </div>
              </div>
           </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-serif text-slate-900 font-bold mb-4">
              Learn. Share. Grow.
            </h1>
            <p className="text-lg text-slate-500 max-w-md mx-auto">
              Your space for discovering and sharing knowledge.
            </p>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-blue-50/50 blur-3xl" />
      </div>

      {/* Right OTP Panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-[440px] bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 mb-6">
            {type === 'mobile' ? (
              <Smartphone className="h-8 w-8 text-indigo-600" />
            ) : (
              <Mail className="h-8 w-8 text-indigo-600" />
            )}
          </div>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-serif font-bold text-slate-900">
              {type === 'mobile' ? 'Enter OTP' : 'Check your email'}
            </h1>
            <p className="mt-2 text-slate-500">
              {type === 'mobile' 
                ? <>Enter the OTP sent to <span className="font-medium text-slate-900">{target}</span></>
                : <>Enter verification code sent to <span className="font-medium text-slate-900">{target}</span></>
              }
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-error-container/20 px-3 py-2 text-sm font-medium text-error">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((data, index) => {
                return (
                  <input
                    className="h-14 w-11 sm:h-16 sm:w-12 text-center text-2xl font-bold rounded-xl border border-gray-200 bg-gray-50/50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    type="text"
                    name="otp"
                    maxLength={1}
                    key={index}
                    value={data}
                    onChange={(e) => handleChange(e.target, index)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => { inputs.current[index] = el; }}
                  />
                );
              })}
            </div>

            <button
              type="submit"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e1b4b] px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-[#312e81] focus:outline-none focus:ring-2 focus:ring-[#312e81] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={otp.join('').length !== OTP_LENGTH || isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Didn't receive the code?{' '}
            <button type="button" onClick={handleResend} className="font-semibold text-indigo-600 hover:text-indigo-500">
              Resend it
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default OtpVerificationPage;
