import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
      <p className="text-headline-xl text-primary">404</p>
      <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">Page not found</h1>
      <p className="max-w-sm text-body-sm text-on-surface-variant">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link to="/" className="mt-2">
        <Button variant="primary">Back to Home</Button>
      </Link>
    </div>
  );
}

export default NotFoundPage;
