import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isIdPublic, setIdPublic } from '../../lib/idUtils';
import { Modal } from '../ui/Modal';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function PrivacySettingsModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [showPublicId, setShowPublicId] = useState(true);

  useEffect(() => {
    if (user?.id && open) {
      setShowPublicId(isIdPublic(user.id));
    }
  }, [user?.id, open]);

  const togglePublicId = () => {
    if (!user?.id) return;
    const nextState = !showPublicId;
    setShowPublicId(nextState);
    setIdPublic(user.id, nextState);
  };

  return (
    <Modal open={open} onClose={onClose} title="Privacy Settings">
      <div className="flex flex-col gap-6 pt-2">
        
        {/* Toggle Option */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body-lg font-semibold text-on-surface">Show User ID Publicly</h3>
            <p className="mt-1 max-w-[280px] text-body-sm text-on-surface-variant">
              When enabled, your 9-digit User ID will be visible on your profile to other users.
            </p>
          </div>
          
          <button
            type="button"
            onClick={togglePublicId}
            aria-label="Toggle Public User ID"
            className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer ${
              showPublicId ? 'bg-primary' : 'bg-surface-container-high'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${
                showPublicId ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

      </div>
    </Modal>
  );
}
