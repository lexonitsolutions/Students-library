import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  FileText,
  Share2,
  Trash2,
  Cookie,
  GraduationCap,
  Mail,
  ArrowLeft,
  Sun,
  Moon,
  Printer,
  Search,
  ExternalLink,
  HelpCircle,
  Clock,
  Building2,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Footer } from '../components/ui/Footer';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import { cn } from '../lib/cn';

interface Section {
  id: string;
  number: string;
  title: string;
  icon: typeof ShieldCheck;
  content: React.ReactNode;
}

export function PrivacyPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isExploring } = useAuth();
  const { theme, cycleTheme } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('overview');

  const sections: Section[] = useMemo(
    () => [
      {
        id: 'overview',
        number: '01',
        title: 'Overview & Our Privacy Commitment',
        icon: ShieldCheck,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              At <strong>Studexa</strong>, operated by <strong>Lexon IT Solutions</strong> (&quot;<strong>we</strong>&quot;, &quot;<strong>our</strong>&quot;, or &quot;<strong>us</strong>&quot;), we believe that students, educators, and academic researchers deserve complete clarity regarding how their personal and educational information is handled.
            </p>
            <p>
              This Privacy Policy explains what information we collect when you use the Studexa digital library, upload course notes, interact with university peers, or communicate with our support desk, and how we protect that information.
            </p>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs sm:text-sm text-on-surface space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={16} />
                <span>Our Core Privacy Pledge to Students:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-on-surface-variant">
                <li><strong>We do not sell</strong> student personal information or study history to data brokers or advertisers.</li>
                <li><strong>We do not run</strong> intrusive behavioral advertising tracking on course materials.</li>
                <li><strong>You retain control:</strong> You can edit your academic profile or permanently delete your account at any time via Settings.</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'information-collected',
        number: '02',
        title: 'Information We Collect',
        icon: Database,
        content: (
          <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
            <p>We collect information in three primary ways: information you provide, information collected automatically, and academic interactions.</p>
            
            <div className="space-y-3">
              <div className="rounded-xl border border-card-border bg-surface-container-low p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 mb-1.5">
                  <UserCheck size={14} className="text-primary" />
                  <span>1. Account &amp; Academic Profile Data</span>
                </h4>
                <p className="text-xs text-on-surface-variant mb-2">
                  When you sign up or complete your profile, we collect:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-on-surface-variant">
                  <li>Full name, display username, and email address.</li>
                  <li>College, university, or institute name.</li>
                  <li>Academic branch/department, graduation year, and current semester.</li>
                  <li>Preferred subjects and curriculum tags.</li>
                  <li>Profile avatar and optional cover banner photo.</li>
                  <li>Contact phone number (only if optionally provided when filing customer support tickets).</li>
                </ul>
              </div>

              <div className="rounded-xl border border-card-border bg-surface-container-low p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 mb-1.5">
                  <FileText size={14} className="text-primary" />
                  <span>2. Uploaded Study Materials &amp; Metadata</span>
                </h4>
                <p className="text-xs text-on-surface-variant mb-2">
                  When you contribute academic resources, our servers store:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-on-surface-variant">
                  <li>Uploaded files (PDF, DOCX, PPTX lecture notes, PYQs, lab manuals, syllabi).</li>
                  <li>Document title, subject name, course code, semester tags, and descriptions.</li>
                  <li>File size, page count, document preview thumbnails, and upload timestamp.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-card-border bg-surface-container-low p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 mb-1.5">
                  <Eye size={14} className="text-primary" />
                  <span>3. Activity &amp; Usage Telemetry</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-on-surface-variant">
                  <li>Personal library bookmarks, saved study guides, and offline download records.</li>
                  <li>Unique material views and likes (to compute community rankings on the Leaderboard).</li>
                  <li>Direct messages between connected students and query tickets submitted to administrators.</li>
                  <li>Device characteristics: browser user agent, operating system, IP address, and session timestamps.</li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'how-we-use',
        number: '03',
        title: 'How We Use Your Information',
        icon: FileText,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>Lexon IT Solutions processes student data strictly for legitimate educational, operational, and safety purposes:</p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Providing the Digital Library:</strong> Storing, indexing, and serving study documents, lecture notes, and past exams through our embedded reader.
              </li>
              <li>
                <strong>Curriculum Personalization:</strong> Recommending textbooks and study materials matching your specific university, branch, and current semester.
              </li>
              <li>
                <strong>Document Moderation &amp; Quality Control:</strong> Reviewing uploaded materials to prevent malware, copyrighted piracy, duplicate files, or academic cheating.
              </li>
              <li>
                <strong>Peer Networking &amp; Student Queries:</strong> Facilitating connection requests, real-time messaging between students, and administrative responses to academic queries.
              </li>
              <li>
                <strong>Account Security &amp; Fraud Prevention:</strong> Verifying email OTPs, preventing automated scraping bots, and detecting suspicious login attempts.
              </li>
              <li>
                <strong>Platform Maintenance:</strong> Diagnosing reader rendering bugs, optimizing server latency, and improving user interface workflows.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'sharing-disclosure',
        number: '04',
        title: 'Information Sharing & Disclosure',
        icon: Share2,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              We treat student information with the highest level of confidentiality. We share data only under the following limited conditions:
            </p>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Public Student Profile</h5>
                <p className="text-xs text-on-surface-variant">
                  Other logged-in students can view your public profile (display name, username, college, branch, uploaded approved notes, and public stats such as total uploads and contribution ranking). Your account password, raw email address, and personal phone number are <strong>never</strong> displayed publicly.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Trusted Cloud Infrastructure Providers</h5>
                <p className="text-xs text-on-surface-variant">
                  We partner with industry-standard cloud providers such as <strong>Supabase</strong> (for managed PostgreSQL database, authentication, and encrypted object storage) and modern hosting infrastructure to run Studexa reliably. These providers process data strictly on our behalf under rigorous data protection agreements.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Legal &amp; Safety Compliance</h5>
                <p className="text-xs text-on-surface-variant">
                  We may disclose information if required by law, subpoena, or valid court order, or when we believe in good faith that disclosure is necessary to protect the rights, property, or physical safety of our students, Lexon IT Solutions, or the general public.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'data-security',
        number: '05',
        title: 'Data Security & Storage Protection',
        icon: Lock,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              We implement comprehensive technical and organizational safeguards designed to protect student data against unauthorized access, destruction, or disclosure:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Row Level Security (RLS):</strong> Our database utilizes strict PostgreSQL Row Level Security policies. This ensures that only authorized users can view or modify their private bookmarks, drafts, and direct messages.
              </li>
              <li>
                <strong>Encryption in Transit:</strong> All data transmitted between your browser and Studexa servers is protected with modern Transport Layer Security (TLS/HTTPS).
              </li>
              <li>
                <strong>Credential Hashing:</strong> Passwords are never stored in plaintext. They are securely salted and hashed using industry-standard cryptographic algorithms.
              </li>
              <li>
                <strong>Isolated File Storage:</strong> Document attachments and user avatars are housed in secure Supabase Storage buckets with granular read/write permission boundaries.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'data-retention',
        number: '06',
        title: 'Data Retention & Self-Service Account Deletion',
        icon: Trash2,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              We retain personal data only for as long as your account remains active or as needed to provide you with academic services.
            </p>
            <div className="rounded-xl border border-card-border bg-surface-container-low p-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                <Trash2 size={14} className="text-error" />
                <span>Self-Service Account Deletion</span>
              </h4>
              <p className="text-xs text-on-surface-variant">
                You can permanently delete your account at any time directly through the{' '}
                <Link to="/settings" className="text-primary font-semibold hover:underline">
                  Settings
                </Link>{' '}
                portal by confirming your password.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-on-surface-variant">
                <li>Your profile credentials, email, phone number, and avatar will be immediately deleted.</li>
                <li>Your private chat histories, bookmarks, and notification logs are wiped.</li>
                <li>To avoid disrupting university courses for classmates who downloaded or saved public lecture notes, approved academic documents may be retained with uploader attribution anonymized.</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'user-rights',
        number: '07',
        title: 'Your Privacy Rights & Choices',
        icon: UserCheck,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>Depending on your geographic jurisdiction, you have several rights regarding your personal information:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Right to Access &amp; Portability</h5>
                <p className="text-xs text-on-surface-variant">
                  You can inspect the profile information, uploaded notes, and bookmarks linked to your profile at any time.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Right to Rectification</h5>
                <p className="text-xs text-on-surface-variant">
                  You can edit your name, university, branch, semester, and avatar instantly from your Profile Settings.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Right to Erasure</h5>
                <p className="text-xs text-on-surface-variant">
                  You can request full removal of your personal information or trigger account deletion via Settings.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Right to Withdraw Consent</h5>
                <p className="text-xs text-on-surface-variant">
                  You can revoke consent for optional features like academic notifications or push updates whenever desired.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'cookies-storage',
        number: '08',
        title: 'Cookies & Browser Local Storage',
        icon: Cookie,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              Studexa uses essential cookies and modern browser Local Storage solely to provide a seamless and secure experience. We do not use third-party tracking pixels or ad network beacons.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-lg border border-card-border bg-surface-container-low">
                <span className="font-mono text-primary font-bold shrink-0">Session Auth:</span>
                <span>Stores secure encrypted tokens so you do not have to log in repeatedly when browsing between notes.</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-card-border bg-surface-container-low">
                <span className="font-mono text-primary font-bold shrink-0">Theme Mode:</span>
                <span>Stores your preference for Dark Mode or Light Mode (<code>lexon-theme</code> / <code>quicklearnit-theme</code>).</span>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-card-border bg-surface-container-low">
                <span className="font-mono text-primary font-bold shrink-0">Guest Exploration:</span>
                <span>Allows first-time students to preview syllabus guides before completing account registration.</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'children-academic',
        number: '09',
        title: 'Academic Community & Age Eligibility',
        icon: GraduationCap,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              Studexa is designed specifically for students in high schools, polytechnic colleges, universities, and adult educators. The Platform is not intended for children under 13 years of age.
            </p>
            <p>
              We do not knowingly collect or solicit personal information from anyone under the age of 13. If we discover that an account has been registered by a child under 13 without verified parental consent, we will promptly delete that account and all associated personal data from our database.
            </p>
          </div>
        ),
      },
      {
        id: 'updates-contact',
        number: '10',
        title: 'Policy Updates & Contacting Us',
        icon: Mail,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              Lexon IT Solutions may update this Privacy Policy periodically to reflect enhancements to Studexa, security best practices, or changing privacy regulations.
            </p>
            <p>
              When changes are published, we will revise the &quot;Last Updated&quot; date at the top of this policy and notify active students through an in-app banner or notification alert.
            </p>
            <div className="rounded-xl border border-card-border bg-surface-container-low p-4 space-y-2">
              <p className="font-bold text-on-surface text-sm">Lexon IT Solutions — Data Protection &amp; Privacy Officer</p>
              <p className="text-xs text-on-surface-variant">
                Support Portal:{' '}
                <Link to="/support" className="text-primary font-medium hover:underline">
                  studexa.app/support
                </Link>
              </p>
              <p className="text-xs text-on-surface-variant">
                To submit data privacy requests, account data exports, or compliance queries, please use our Customer Support Center.
              </p>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase().trim();
    return sections.filter((s) => {
      return (
        s.title.toLowerCase().includes(q) ||
        s.number.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [sections, searchQuery]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSectionId(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ── STICKY TOP NAVIGATION BAR ── */}
      <header className="sticky top-0 z-40 w-full border-b border-card-border bg-surface/90 backdrop-blur-md transition-colors print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand & Back Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else if (isAuthenticated && !isExploring) {
                  navigate('/dashboard');
                } else {
                  navigate('/get-started');
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>

            <Link to={isAuthenticated && !isExploring ? '/dashboard' : '/get-started'} className="flex items-center">
              <Logo height={30} />
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck size={12} />
              <span>Privacy Policy</span>
            </span>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Link to Terms */}
            <Link
              to="/terms"
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors hidden md:inline-block px-2 py-1"
            >
              Terms of Service
            </Link>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              title="Print or Save as PDF"
              aria-label="Print or Save as PDF"
            >
              <Printer size={16} />
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={cycleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-amber-500" />}
            </button>

            {/* Account / Dashboard Button */}
            {isAuthenticated && !isExploring ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-hover px-3.5 py-2 text-xs font-semibold text-white transition-all shadow-xs"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/signin"
                className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-hover px-3.5 py-2 text-xs font-semibold text-white transition-all shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="relative border-b border-card-border bg-gradient-to-b from-surface-container-low via-surface to-surface py-12 sm:py-16 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[36rem] rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
              <Lock size={13} />
              <span>Student Data Protection &amp; Confidentiality</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface">
              Privacy Policy
            </h1>

            <p className="mt-3 text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-2xl">
              Learn how Studexa and Lexon IT Solutions collect, protect, and handle your academic data, notes, and profile details with complete transparency.
            </p>

            {/* Document Metadata Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1.5">
                <Clock size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Last Updated: September 2026</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1.5">
                <Building2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Lexon IT Solutions</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1.5">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Zero Data Selling Policy</span>
              </span>
            </div>
          </div>

          {/* Quick Search bar for privacy topics */}
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
              <input
                type="text"
                placeholder="Search privacy topics (e.g. deletion, cookies, uploads, security)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-card-border bg-surface-container-low pl-10 pr-4 py-2.5 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT (TWO-COLUMN WITH STICKY TABLE OF CONTENTS) ── */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Sidebar: Table of Contents (Desktop Sticky) */}
          <aside className="hidden lg:block lg:col-span-4 print:hidden">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-card-border bg-surface-container-low p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-card-border mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Privacy Topics
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {sections.length} Sections
                  </span>
                </div>

                <nav className="space-y-0.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 text-xs no-scrollbar">
                  {sections.map((section) => {
                    const isActive = activeSectionId === section.id;
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer group',
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-mono text-on-surface-variant/70">
                            {section.number}
                          </span>
                          <span className="truncate">{section.title}</span>
                        </span>
                        <ChevronRight
                          size={13}
                          className={cn(
                            'shrink-0 transition-transform',
                            isActive
                              ? 'text-emerald-600 dark:text-emerald-400 translate-x-0.5'
                              : 'text-on-surface-variant/30 group-hover:text-on-surface-variant'
                          )}
                        />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Card: Support Desk */}
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-surface-container-low to-emerald-500/5 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <HelpCircle size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Data Privacy Query?</h4>
                    <p className="text-[11px] text-on-surface-variant">Our compliance team is here to help.</p>
                  </div>
                </div>
                <Link
                  to="/support"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-surface border border-card-border px-3 py-2 text-xs font-semibold text-on-surface hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                >
                  <span>Contact Privacy Team</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Right Column: Full Privacy Sections */}
          <div className="lg:col-span-8 space-y-8">
            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-card-border p-12 text-center">
                <Search size={28} className="mx-auto text-on-surface-variant/50 mb-3" />
                <h4 className="text-sm font-semibold text-on-surface">No matching privacy topics found</h4>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Try searching for another keyword such as &quot;delete&quot;, &quot;security&quot;, or &quot;cookies&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Reset search filter
                </button>
              </div>
            ) : (
              filteredSections.map((section) => {
                const Icon = section.icon;
                return (
                  <motion.article
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.3 }}
                    className="scroll-mt-24 rounded-2xl border border-card-border bg-surface-container-low p-6 sm:p-8 shadow-2xs space-y-5"
                  >
                    {/* Section Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-card-border/70 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Icon size={19} />
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Section {section.number}
                          </div>
                          <h2 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight">
                            {section.title}
                          </h2>
                        </div>
                      </div>
                    </div>

                    {/* Section Content */}
                    <div className="pt-1">{section.content}</div>
                  </motion.article>
                );
              })
            )}

            {/* Bottom Cross Link to Terms of Service */}
            <div className="rounded-2xl border border-card-border bg-surface-container-high/50 p-6 sm:p-8 text-center space-y-3">
              <h3 className="text-base font-bold text-on-surface">
                Looking for our terms and conditions?
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto">
                Read the Studexa Academic Honor Code, upload licenses, document moderation standards, and user agreement.
              </p>
              <div className="pt-2">
                <Link
                  to="/terms"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all"
                >
                  <span>Read Terms of Service</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}

export default PrivacyPage;
