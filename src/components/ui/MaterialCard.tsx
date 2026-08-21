import { DocumentPreviewCard, type DocumentPreviewCardProps } from './DocumentPreviewCard';

export type MaterialCardProps = DocumentPreviewCardProps;

export function MaterialCard({ material, onToggleSave, onUploaderClick, className }: Readonly<MaterialCardProps>) {
  return <DocumentPreviewCard material={material} onToggleSave={onToggleSave} onUploaderClick={onUploaderClick} className={className} />;
}

export default MaterialCard;
