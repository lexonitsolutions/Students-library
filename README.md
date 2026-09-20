# 📚 answersbro

**answersbro** is a modern, feature-rich digital library and study material sharing platform designed specifically for students and educators. It streamlines the sharing of academic resources such as lecture notes, textbooks, previous year question papers, lab manuals, and syllabus guides across different departments and semesters.

---

## 🌟 Key Features

- **🔐 Authentication & Onboarding**: Complete sign-in, sign-up, and OTP verification flows, accompanied by an interactive onboarding guide for new users.
- **📊 Interactive Dashboard**: Personalized dashboard showcasing recent study activity, quick stats, announcements, and recommended learning resources.
- **🔍 Explore & Search Hub**: Multi-filter resource search by department, semester, subject, file format (PDF, DOCX, PPTX), and document type.
- **📖 Embedded Reader**: Built-in document viewer with zoom controls, page navigation, bookmarking, and full-screen reading options.
- **📤 Upload & Share Center**: Drag-and-drop file uploader supporting rich metadata tags (subject, code, semester, branch, cover image).
- **📚 Personal Library**: Organized bookshelf containing saved items, favorite resources, and downloaded offline files.
- **👤 Profile & Upload Tracker**: Personal profile management, security preferences, dark mode toggle, and upload contribution tracking.
- **🛡️ Admin Management Portal**: Moderation dashboard for administrators to monitor user activities, approve/reject uploads, and view system statistics.
- **🌙 Dark Mode & Responsive Design**: Seamless switching between Light and Dark themes with full responsiveness across mobile, tablet, and desktop viewports.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling & UI**: Tailwind CSS v4, Framer Motion (Animations), Custom Utility System
- **Icons**: Lucide React
- **Routing**: React Router v7
- **Code Quality & Linting**: Oxlint

---

## 🚀 How to Run the Application

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/lexonitsolutions/answersbro.git
cd answersbro
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

### 6. Code Linting
```bash
npm run lint
```

---

## 📅 Development Progress Log (Day 1 - Today)

Below is the breakdown of development milestones completed today:

| Session / Phase | Phase Focus | Key Deliverables & Activities | Contributors |
| :--- | :--- | :--- | :--- |
| **Phase 1 (Morning)** | **Project Setup & Base Architecture** | • Scaffolding Vite + React 19 + TypeScript template.<br>• Configuring Tailwind CSS v4, Oxlint, and React Router v7.<br>• Designing UI layout system (Sidebar, TopBar, AppShell, BottomNav).<br>• Creating reusable UI component library (Button, Card, Modal, Input, Select, Tabs, StatTile).<br>• Building mock dataset (`mockData.ts`) & core routes (Explore, Library, Reader, Admin). | **Davood-lexonit** |
| **Phase 2 (Afternoon)** | **Auth Flow, Theme System & Page Polish** | • Implementing Sign In & Sign Up pages with form validation.<br>• Creating the OTP Verification screen (`OtpVerificationPage.tsx`).<br>• Building Dark Mode hook (`useDarkMode.ts`) & CSS color variables.<br>• Refining Notification center & user settings modal.<br>• Enhancing Profile and Uploads management pages. | **sadhik** |
| **Phase 3 (Evening)** | **Documentation & Project Cleanup** | • Comprehensive code review and linting validation.<br>• Creating project documentation and updating `README.md`.<br>• Finalizing deployment setup and responsive UI checks. | **sadhik**, **Davood-lexonit** |
| **Phase 4 (Night)** | **Premium UI/UX Overhaul & Aesthetics** | • Introduced global "Medium Liquid Glass" design with translucent backgrounds & backdrop blurs.<br>• Redesigned Dark Mode for comfortable reading and high icon contrast.<br>• Upgraded Profile page with a customizable cover banner layout.<br>• Replaced bouncy animations with classic, refined CSS hover states.<br>• Implemented a fixed desktop shell and dynamic scroll-aware floating mobile nav. | **sadhik** |

---

## 👥 Contributors & Team

| Contributor | GitHub Username | Role / Key Contributions |
| :--- | :--- | :--- |
| **Davood-lexonit** | [@Davood-lexonit](https://github.com/Davood-lexonit) | **Lead Frontend Architect** — Initial app scaffold, routing architecture, base UI component library, mock data layer, Explore & Admin dashboard modules. |
| **Sadhik** | [@sadhik](https://github.com/sadhik) | **UI/UX & Feature Engineer** — Auth & OTP verification flows, dark mode implementation, notification system, profile page redesign, and project documentation. |

---

## 📄 License

This project is maintained by **Lexon IT Solutions** for educational and collaborative study purposes.

