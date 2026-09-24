import { createRoot } from 'react-dom/client';
import { AILearningPage } from '../../src/pages/AILearningPage';
import './styles.css';
const dark = new URLSearchParams(location.search).get('theme') === 'dark';
document.documentElement.classList.toggle('dark', dark);
createRoot(document.getElementById('root')!).render(<main className="min-h-screen bg-surface px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-8"><AILearningPage /></main>);
