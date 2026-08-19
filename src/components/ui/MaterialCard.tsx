

import { DocumentPreviewCard, type DocumentPreviewCardProps } from './DocumentPreviewCard';

export type MaterialCardProps = DocumentPreviewCardProps;

export function MaterialCard({ material, onToggleSave, className }: Readonly<MaterialCardProps>) {
  return <DocumentPreviewCard material={material} onToggleSave={onToggleSave} className={className} />;
}

export default MaterialCard;
