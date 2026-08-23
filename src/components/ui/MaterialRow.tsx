import { Bookmark, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Material } from '../../data/types';
import { accentBg, materialTypeIcon } from '../../lib/materialIcons';
import { cn } from '../../lib/cn';
import { IconButton } from './IconButton';
import { useAuth } from '../../hooks/useAuth';
import { useSignupRedirect } from '../../hooks/useSignupRedirect';

export interface MaterialRowProps {
  readonly material: Material;
  readonly onToggleSave?: (id: string) => void;
}

export function MaterialRow({ material, onToggleSave }: Readonly<MaterialRowProps>) {
  const { isExploring } = useAuth();
  const { openSignupModal } = useSignupRedirect();
  const TypeIcon = materialTypeIcon[material.type];

  const handleClick = (e: React.MouseEvent) => {
    if (isExploring) {
      e.preventDefault();
      e.stopPropagation();
      openSignupModal(`/materials/${material.id}`);
    }
  };

  return (
    <Link
      to={`/materials/${material.id}`}
      onClick={handleClick}
      className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-card-border px-2 py-3 text-body-sm transition-colors duration-150 last:border-b-0 hover:bg-surface-soft"
    >
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-md', accentBg[material.accentColor])}>
        <TypeIcon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-on-surface">{material.title}</span>
        <span className="block text-label-sm text-on-surface-variant">{material.subject}</span>
      </span>
      <span className="hidden text-label-sm text-on-surface-variant sm:inline">{material.uploaderName}</span>
      <span className="hidden items-center gap-1 text-label-sm text-on-surface-variant md:flex">
        <Eye size={14} /> {material.views >= 1000 ? `${(material.views / 1000).toFixed(1)}k` : material.views}
      </span>
      <IconButton
        label={material.isSaved ? 'Remove from saved' : 'Save material'}
        onClick={(event) => {
          event.preventDefault();
          if (isExploring) {
            openSignupModal(`/materials/${material.id}`);
          } else {
            onToggleSave?.(material.id);
          }
        }}
      >
        <Bookmark size={16} fill={material.isSaved ? 'currentColor' : 'none'} />
      </IconButton>
    </Link>
  );
}

export default MaterialRow;
