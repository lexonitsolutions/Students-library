import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Scale,
  ShieldCheck,
  BookOpen,
  AlertTriangle,
  FileCheck,
  Search,
  Printer,
  ArrowLeft,
  ExternalLink,
  HelpCircle,
  Clock,
  UserCheck,
  MessageSquare,
  Sparkles,
  Building2,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Footer } from '../components/ui/Footer';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';

interface Section {
  id: string;
  number: string;
  title: string;
  icon: typeof Scale;
  content: React.ReactNode;
}

export function TermsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isExploring } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('acceptance');

  const sections: Section[] = useMemo(
    () => [
      {
        id: 'acceptance',
        number: '01',
        title: 'Acceptance of Terms',
        icon: Scale,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              These Terms and Conditions (&quot;<strong>Terms</strong>&quot;, &quot;<strong>Agreement</strong>&quot;) constitute a legally binding agreement between you (&quot;<strong>User</strong>&quot;, &quot;<strong>Student</strong>&quot;, &quot;<strong>you</strong>&quot;) and <strong>Lexon IT Solutions</strong> (&quot;<strong>answersbro</strong>&quot;, &quot;<strong>we</strong>&quot;, &quot;<strong>our</strong>&quot;, &quot;<strong>us</strong>&quot;), regarding your access to and use of the answersbro web platform, applications, reader utilities, and academic sharing services (collectively, the &quot;<strong>Platform</strong>&quot;).
            </p>
            <p>
              By accessing, browsing, registering for an account, uploading study documents, or reading course notes on answersbro, you explicitly acknowledge that you have read, understood, and agreed to be bound by these Terms, as well as our <Link to="/privacy" className="text-primary font-medium hover:underline">Privacy Policy</Link>. If you do not agree with any part of these Terms, you must immediately discontinue your use of the Platform.
            </p>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-on-surface">
              <span className="font-semibold text-primary">Summary in Plain English:</span> answersbro is a collaborative platform designed by students and educators to organize and share university notes. By using answersbro, you promise to uphold academic honesty, respect copyright laws, and treat peers respectfully.
            </div>
          </div>
        ),
      },
      {
        id: 'eligibility',
        number: '02',
        title: 'Eligibility & Account Security',
        icon: UserCheck,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              To create an account and access features such as uploading documents, peer messaging, and downloading resources, you must meet the following criteria:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Academic Affiliation:</strong> You should be a currently enrolled high school, polytechnic, undergraduate, or graduate student, educator, or independent academic learner.
              </li>
              <li>
                <strong>Age Requirement:</strong> You must be at least 13 years of age (or the minimum legal age for digital consent in your jurisdiction). If you are under 18, you affirm that you have obtained permission from a parent or legal guardian to use the Platform.
              </li>
              <li>
                <strong>Accurate Account Information:</strong> You agree to provide true, accurate, and current information regarding your identity, college or university name, department, semester, and email address during registration.
              </li>
              <li>
                <strong>Credential Confidentiality:</strong> You are solely responsible for preserving the confidentiality of your login credentials (passwords, OTP codes, or OAuth session access). You agree to immediately notify Lexon IT Solutions of any unauthorized use or security breach of your account.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'honor-code',
        number: '03',
        title: 'answersbro Academic Honor Code',
        icon: BookOpen,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              answersbro exists to empower students through legitimate academic collaboration, peer review, and accessible reference materials. We strictly condemn any practice that undermines academic integrity or institutional codes of conduct.
            </p>
            <div className="rounded-xl border border-error/30 bg-error-container/15 p-4 text-xs sm:text-sm text-on-surface space-y-2">
              <div className="flex items-center gap-2 text-error font-semibold text-sm">
                <AlertTriangle size={16} />
                <span>Strictly Prohibited Academic Violations</span>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-on-surface-variant">
                <li>Uploading unreleased, confidential, or live examination question papers or leaked test keys.</li>
                <li>Sharing materials during active proctored tests, online quizzes, or university exams.</li>
                <li>Submitting another student&apos;s uploaded project code, lab report, or thesis as your own original work (plagiarism).</li>
                <li>Commercializing or selling campus lecture materials, professor presentations, or departmental internal records without express authority.</li>
              </ul>
            </div>
            <p className="text-xs">
              Violations of this Honor Code may result in immediate suspension or permanent termination of your answersbro profile, removal of all uploaded documents, and potential notification to the respective academic institution where legally required or warranted.
            </p>
          </div>
        ),
      },
      {
        id: 'user-content',
        number: '04',
        title: 'User-Generated Content & Upload Licenses',
        icon: FileCheck,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              Our Platform allows users to upload academic resources including lecture summaries, handwritten notes, laboratory manuals, previous year question papers (PYQs), and syllabus frameworks (&quot;<strong>User Content</strong>&quot;).
            </p>
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">1. Ownership of Your Notes</h4>
              <p>
                You retain all copyright and intellectual property rights in the original academic notes, summaries, and materials that you author and submit to answersbro.
              </p>
            </div>
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">2. License Granted to answersbro</h4>
              <p>
                By submitting or uploading User Content to answersbro, you grant Lexon IT Solutions and answersbro a non-exclusive, worldwide, royalty-free, transferable, and sublicensable license to host, store, cache, parse, render, index, distribute, and display your uploaded materials solely for the purpose of operating, improving, and promoting the Platform and its academic community.
              </p>
            </div>
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">3. Content Representations &amp; Warranties</h4>
              <p>
                You represent and warrant that: (a) you own or have obtained all necessary licenses, permissions, and rights to upload the materials; (b) the materials do not violate third-party intellectual property, privacy, or moral rights; and (c) the file does not contain viruses, malicious payloads, corrupted data, or hidden tracking scripts.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'moderation',
        number: '05',
        title: 'Document Moderation & Verification Standards',
        icon: ShieldCheck,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              To maintain high educational standards, every document uploaded to answersbro undergoes a moderation workflow. Our system evaluates submissions for clarity, categorization accuracy (college, subject code, semester), formatting, and safety.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Approval Status:</strong> Uploaded materials may be marked as <code>Pending</code>, <code>Approved</code>, or <code>Rejected</code>. Only approved materials are made publicly discoverable in the central library.
              </li>
              <li>
                <strong>Rejection Justifications:</strong> If an upload is rejected, answersbro provides a constructive feedback reason (such as illegible scans, missing subject metadata, duplicate submission, or copyright concerns).
              </li>
              <li>
                <strong>Admin Discretion:</strong> answersbro administrators reserve the unconditional right to reclassify, unpublish, unlist, or remove any document at any time without prior notice if it is found to violate community guidelines or applicable laws.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'prohibited-conduct',
        number: '06',
        title: 'Acceptable Use & Prohibited Activities',
        icon: AlertTriangle,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>You agree not to engage in any of the following prohibited behaviors while using answersbro:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Automated Scraping &amp; Crawling</h5>
                <p className="text-xs text-on-surface-variant">
                  Using bots, spiders, or automated scripts to mass download study documents, scrape user profiles, or circumvent rate limits.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Commercial Exploitation</h5>
                <p className="text-xs text-on-surface-variant">
                  Reselling documents, charging peers for notes accessed through answersbro, or using the Platform for third-party commercial advertisements.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Platform Abuse &amp; Exploits</h5>
                <p className="text-xs text-on-surface-variant">
                  Attempting to bypass Supabase Row Level Security (RLS), probe server vulnerabilities, or flood storage buckets with corrupted files.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-card-border bg-surface-container-low">
                <h5 className="text-xs font-bold text-on-surface mb-1">Harassment &amp; Spam</h5>
                <p className="text-xs text-on-surface-variant">
                  Using peer messaging, connection requests, or query tickets to bully students, distribute phishing links, or send unsolicited promotions.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'copyright-dmca',
        number: '07',
        title: 'Intellectual Property & Copyright Policy (DMCA)',
        icon: Scale,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              Lexon IT Solutions respects the intellectual property rights of authors, publishing houses, professors, and universities. We comply with applicable copyright laws, including notice and takedown procedures under the Digital Millennium Copyright Act (&quot;<strong>DMCA</strong>&quot;) and equivalent international frameworks.
            </p>
            <div className="space-y-2 text-xs sm:text-sm">
              <h4 className="font-semibold text-on-surface">Filing a Copyright Infringement Notice:</h4>
              <p>
                If you believe that your copyrighted book, published syllabus, or course pack has been uploaded to answersbro without proper authorization, please submit a formal takedown request containing:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-xs text-on-surface-variant">
                <li>Identification of the copyrighted work claimed to have been infringed.</li>
                <li>The exact URL, material title, or identifier of the infringing item on answersbro.</li>
                <li>Your contact details, including legal name, address, telephone number, and official email address.</li>
                <li>A statement of good faith belief that the disputed use is not authorized by the copyright owner or the law.</li>
                <li>A statement under penalty of perjury that the information in your notice is accurate and that you are the owner or authorized agent.</li>
              </ol>
            </div>
            <div className="rounded-xl border border-card-border bg-surface-container-low p-3.5 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-primary shrink-0" />
                <span className="text-on-surface">Send all copyright notices directly to our support desk.</span>
              </div>
              <Link to="/support" className="text-primary font-semibold hover:underline shrink-0 flex items-center gap-1">
                <span>Submit Ticket</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        ),
      },
      {
        id: 'messaging',
        number: '08',
        title: 'Peer Messaging & Student Queries',
        icon: MessageSquare,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              answersbro includes interactive collaboration tools such as peer-to-peer connection requests, direct messaging, and the Student Queries portal. When participating in discussions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Academic Purpose:</strong> Messaging must remain constructive and focused on course syllabus, exam preparation, project collaboration, and academic guidance.
              </li>
              <li>
                <strong>Safety &amp; Privacy:</strong> Never request or reveal sensitive personal credentials, payment information, or private phone numbers in public student query chats.
              </li>
              <li>
                <strong>Zero Tolerance for Abuse:</strong> Threatening, abusive, defamatory, or sexually suggestive communication will result in an immediate permanent ban across all answersbro services.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'disclaimers',
        number: '09',
        title: 'Disclaimer of Warranties',
        icon: AlertTriangle,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p className="uppercase text-xs font-bold tracking-wider text-on-surface">
              Please read this section carefully as it limits our liability.
            </p>
            <p>
              The answersbro Platform, materials, reader utilities, and recommendations are provided on an <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis, without warranties of any kind, whether express or implied.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>No Academic Guarantee:</strong> Lexon IT Solutions does not guarantee that using materials from answersbro will result in passing grades, high exam scores, or university admission.
              </li>
              <li>
                <strong>Accuracy of Notes:</strong> User-submitted study materials reflect the personal notes and interpretations of individual students. answersbro does not verify the mathematical, scientific, or factual accuracy of notes. Students are strongly advised to verify information against prescribed textbooks and official faculty syllabi.
              </li>
              <li>
                <strong>Service Availability:</strong> We do not warrant that Platform operations will be uninterrupted, error-free, completely secure, or free from server latency.
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: 'limitation-liability',
        number: '10',
        title: 'Limitation of Liability & Indemnity',
        icon: Scale,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              To the maximum extent permitted by applicable law, in no event shall <strong>Lexon IT Solutions</strong>, its directors, developers, affiliates, or licensors be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Loss of academic credit, failed examinations, or institutional disciplinary actions;</li>
              <li>Loss of data, study notes, or download history;</li>
              <li>Personal injury or property damage resulting from access to or use of the Platform;</li>
              <li>Unauthorized access to or alteration of your user transmissions or study documents.</li>
            </ul>
            <p className="text-xs">
              You agree to defend, indemnify, and hold harmless Lexon IT Solutions against any claims, liabilities, damages, and expenses (including legal fees) arising from your User Content or breach of these Terms.
            </p>
          </div>
        ),
      },
      {
        id: 'termination',
        number: '11',
        title: 'Account Termination & Deletion',
        icon: Clock,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              You may terminate your agreement with answersbro at any time by deleting your account via the <Link to="/settings" className="text-primary font-semibold hover:underline">Settings</Link> page. Upon confirmation:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>Your personal profile, contact email, and authentication credentials will be immediately severed.</li>
              <li>Your active peer chat sessions and bookmarks will be purged.</li>
              <li>Publicly shared academic notes that have been approved for community reference may remain archived in an anonymized state to maintain academic continuity for peers who saved them, unless an explicit copyright takedown is requested.</li>
            </ul>
            <p className="text-xs">
              answersbro reserves the right to suspend or terminate accounts that breach these Terms or exhibit malicious activity without notice.
            </p>
          </div>
        ),
      },
      {
        id: 'governing-law',
        number: '12',
        title: 'Governing Law & Dispute Resolution',
        icon: Building2,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>
            <p>
              Any legal action or proceeding arising under this Agreement shall be brought exclusively in the courts of competent jurisdiction located in India, and the parties hereby consent to the personal jurisdiction and venue therein.
            </p>
          </div>
        ),
      },
      {
        id: 'modifications',
        number: '13',
        title: 'Modifications to Terms',
        icon: Sparkles,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              Lexon IT Solutions reserves the right to revise, update, or replace these Terms at any time to reflect evolving academic laws, new platform features, or operational improvements.
            </p>
            <p>
              When material changes are made, we will update the &quot;Last Updated&quot; date at the top of this page and post an announcement in the platform notifications. Your continued use of answersbro after the effective date of updated Terms constitutes your explicit acceptance of the changes.
            </p>
          </div>
        ),
      },
      {
        id: 'contact',
        number: '14',
        title: 'Contact Information & Support',
        icon: HelpCircle,
        content: (
          <div className="space-y-3.5 text-sm text-on-surface-variant leading-relaxed">
            <p>
              If you have any questions, feedback, or concerns regarding these Terms and Conditions, or wish to report a copyright or academic integrity violation, please reach out to our team:
            </p>
            <div className="rounded-xl border border-card-border bg-surface-container-low p-4 space-y-2">
              <p className="font-bold text-on-surface text-sm">Lexon IT Solutions — answersbro Team</p>
              <p className="text-xs text-on-surface-variant">
                Support Portal:{' '}
                <Link to="/support" className="text-primary font-medium hover:underline">
                  answersbro.app/support
                </Link>
              </p>
              <p className="text-xs text-on-surface-variant">
                Inquiries: Accessible via our dedicated in-app Customer Support Ticket System.
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer shrink-0"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>

            <Link to={isAuthenticated && !isExploring ? '/dashboard' : '/get-started'} className="flex items-center">
              <Logo height={28} imgClassName="h-7 sm:h-[30px] w-auto object-contain" />
            </Link>
          </div>

          {/* Right Action Tools: Print only */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handlePrint}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer shrink-0"
              title="Print or Save as PDF"
              aria-label="Print or Save as PDF"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="relative border-b border-card-border bg-gradient-to-b from-surface-container-low via-surface to-surface py-12 sm:py-16 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[36rem] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              <Scale size={13} />
              <span>Legal Agreement &amp; Honor Code</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface">
              Terms and Conditions
            </h1>

            <p className="mt-3 text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-2xl">
              Please read these terms carefully. They govern your use of answersbro&apos;s digital library, document uploads, peer interactions, and services operated by Lexon IT Solutions.
            </p>

            {/* Document Metadata Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1.5">
                <Clock size={13} className="text-primary" />
                <span>Last Updated: September 2026</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1.5">
                <Building2 size={13} className="text-primary" />
                <span>Lexon IT Solutions</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-surface-container-low px-2.5 py-1.5">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Academic Integrity Enforced</span>
              </span>
            </div>
          </div>

          {/* Quick Search bar for clauses */}
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70" />
              <input
                type="text"
                placeholder="Search clauses (e.g. copyright, uploads, cheating, honor code)..."
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
                    Table of Contents
                  </h3>
                  <span className="text-[11px] font-semibold text-primary">
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
                            ? 'bg-primary/10 text-primary font-semibold'
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
                              ? 'text-primary translate-x-0.5'
                              : 'text-on-surface-variant/30 group-hover:text-on-surface-variant'
                          )}
                        />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Card: Support Desk */}
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-surface-container-low to-primary/5 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <HelpCircle size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-on-surface">Have Legal Questions?</h4>
                    <p className="text-[11px] text-on-surface-variant">Our support team is here to assist.</p>
                  </div>
                </div>
                <Link
                  to="/support"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-surface border border-card-border px-3 py-2 text-xs font-semibold text-on-surface hover:border-primary/40 hover:text-primary transition-all"
                >
                  <span>Open Support Ticket</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Right Column: Full Terms Sections */}
          <div className="lg:col-span-8 space-y-8">
            {filteredSections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-card-border p-12 text-center">
                <Search size={28} className="mx-auto text-on-surface-variant/50 mb-3" />
                <h4 className="text-sm font-semibold text-on-surface">No matching clauses found</h4>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Try searching for another keyword such as &quot;moderation&quot;, &quot;copyright&quot;, or &quot;notes&quot;.
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                          <Icon size={19} />
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-semibold text-primary uppercase tracking-wider">
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

            {/* Bottom Cross Link to Privacy Policy */}
            <div className="rounded-2xl border border-card-border bg-surface-container-high/50 p-6 sm:p-8 text-center space-y-3">
              <h3 className="text-base font-bold text-on-surface">
                Looking for our data privacy details?
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto">
                Discover how answersbro and Lexon IT Solutions safeguard student profiles, uploaded documents, and academic interactions.
              </p>
              <div className="pt-2">
                <Link
                  to="/privacy"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all"
                >
                  <span>Read Privacy Policy</span>
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

export default TermsPage;
