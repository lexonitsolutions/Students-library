import { Bookmark, Download, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Material } from '../../data/types';
import { accentBg, materialTypeIcon } from '../../lib/materialIcons';
import { cn } from '../../lib/cn';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { IconButton } from './IconButton';

export interface MaterialCardProps {
  readonly material: Material;
  readonly onToggleSave?: (id: string) => void;
}

function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function MaterialCard({ material, onToggleSave }: Readonly<MaterialCardProps>) {
  const TypeIcon = materialTypeIcon[material.type];

  return (
    <Card padded={false} className="flex flex-col overflow-hidden">
      <Link to={`/materials/${material.id}`} className="flex flex-1 flex-col p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', accentBg[material.accentColor])}>
            <TypeIcon size={22} />
          </div>
          <IconButton
            label={material.isSaved ? 'Remove from saved' : 'Save material'}
            onClick={(event) => {
              event.preventDefault();
              onToggleSave?.(material.id);
            }}
          >
            <Bookmark size={18} fill={material.isSaved ? 'currentColor' : 'none'} />
          </IconButton>
        </div>

        <div className="mt-4 flex items-center gap-2 text-label-sm text-on-surface-variant">
          <span>{material.subject}</span>
          <span aria-hidden>&middot;</span>
          <span>{material.semester}</span>
        </div>

        <h3 className="mt-1.5 line-clamp-2 text-headline-md text-on-surface">{material.title}</h3>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Avatar name={material.uploaderName} src={material.uploaderAvatar} size={24} />
          <span className="text-body-sm text-on-surface-variant">{material.uploaderName}</span>
        </div>
      </Link>

      <div className="flex items-center gap-4 border-t border-card-border px-6 py-3 text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1">
          <Eye size={14} /> {formatCount(material.views)}
        </span>
        <span className="flex items-center gap-1">
          <Download size={14} /> {formatCount(material.downloads)}
        </span>
      </div>
    </Card>
  );
}

export default MaterialCard;
