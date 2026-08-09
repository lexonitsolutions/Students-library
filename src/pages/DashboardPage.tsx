import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { MaterialCard } from '../components/ui/MaterialCard';
import { MaterialRow } from '../components/ui/MaterialRow';
import { categories, materials } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';
import { categoryIcon } from '../lib/materialIcons';

export function DashboardPage() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) =>
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const featured = materials.slice(0, 3);
  const recent = [...materials].sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)).slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          Good morning, {user?.username || user?.name}
        </h1>
        <p className="mt-1 text-body-sm text-on-surface-variant sm:text-body-md">
          Let&apos;s continue your studies where you left off.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.map((category, index) => {
          const Icon = categoryIcon[category.icon];
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
            >
              <Card hoverable={false} className="flex flex-col gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-label-md font-semibold text-on-surface">{category.label}</p>
                  <p className="text-label-sm text-on-surface-variant">{category.count.toLocaleString()} documents</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-headline-md text-on-surface">Featured Materials</h2>
          <Link to="/explore" className="text-label-md font-semibold text-primary">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((material) => (
            <MaterialCard key={material.id} material={material} onToggleSave={toggleSave} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-headline-md text-on-surface">Recently Uploaded</h2>
          <button
            type="button"
            aria-label="Filter recently uploaded"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
          >
            <Filter size={18} />
          </button>
        </div>
        <Card padded={false} hoverable={false} className="overflow-hidden">
          <div className="flex flex-col">
            {recent.map((material) => (
              <MaterialRow
                key={material.id}
                material={{ ...material, isSaved: savedIds.has(material.id) }}
                onToggleSave={toggleSave}
              />
            ))}
          </div>
          <Link
            to="/library"
            className="block border-t border-card-border py-3 text-center text-label-md font-semibold text-primary"
          >
            View all uploads
          </Link>
        </Card>
      </section>
    </div>
  );
}

export default DashboardPage;
