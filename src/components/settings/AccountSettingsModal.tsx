import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Camera, AlertCircle, X, Upload } from 'lucide-react';
import { uploadAvatar } from '../../services/profileService';
import { resizeImageFile } from '../../lib/imageUtils';
import { cn } from '../../lib/cn';

const AVATAR_PRESETS = [
  'https://i.pravatar.cc/400?img=12',
  'https://i.pravatar.cc/400?img=33',
  'https://i.pravatar.cc/400?img=68',
  'https://i.pravatar.cc/400?img=47',
  'https://i.pravatar.cc/400?img=11',
];

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ open, onClose }: AccountSettingsModalProps) {
  const { user, updateUser } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState(user?.name ?? '');
  const [editUsername, setEditUsername] = useState(user?.username ?? '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar ?? '');
  const [editCover, setEditCover] = useState(user?.coverImage ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user && open) {
      setEditName(user.name);
      setEditUsername(user.username ?? user.name.toLowerCase().replace(/\s+/g, ''));
      setEditAvatar(user.avatar);
      setEditCover(user.coverImage ?? '');
      setSaveError(null);
    }
  }, [user, open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadAvatar(user.id, file);
      setEditAvatar(publicUrl);
    } catch (err) {
      console.error('Failed to upload avatar, falling back to local base64:', err);
      try {
        const dataUrl = await resizeImageFile(file, 800);
        setEditAvatar(dataUrl);
      } catch (e) {
        console.error('Failed to resize avatar', e);
      }
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await resizeImageFile(file, 1200);
        setEditCover(dataUrl);
      } catch (e) {
        console.error('Failed to resize cover', e);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateUser({
        name: editName.trim(),
        username: editUsername.trim(),
        avatar: editAvatar,
        coverImage: editCover,
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to save profile in AccountSettingsModal:', err);
      let msg = 'Failed to save changes. Please try again.';
      if (err?.code === '23505' || err?.message?.includes('duplicate key') || err?.message?.includes('username')) {
        msg = 'This username is already taken. Please choose another username.';
      } else if (err?.message) {
        msg = err.message;
      }
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Personal Information"
      description="Update your public profile display name, avatar, and banner."
    >
      <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.JPG,.JPEG,.PNG,.WEBP,.HEIC"
          className="hidden"
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={coverInputRef}
          accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.JPG,.JPEG,.PNG,.WEBP,.HEIC"
          className="hidden"
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={handleCoverChange}
        />

        {/* Cover Banner Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-on-surface">Cover Banner</span>
          <div className="relative h-28 w-full rounded-lg overflow-hidden border border-card-border bg-surface-container-low shadow-2xs">
            {editCover ? (
              <img src={editCover} alt="Cover Preview" className="h-full w-full object-cover object-center" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-primary/10 via-primary/5 to-surface-container-high flex items-center justify-center text-xs text-on-surface-variant/60">
                No cover banner set
              </div>
            )}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white text-[11px] font-medium px-2.5 py-1 backdrop-blur-md transition-colors cursor-pointer"
              >
                <Camera size={12} />
                <span>{editCover ? 'Change' : 'Upload'}</span>
              </button>
              {editCover && (
                <button
                  type="button"
                  onClick={() => setEditCover('')}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer"
                  title="Remove banner"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Photo / Avatar Row */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-on-surface">Profile Photo</span>
          <div className="flex items-center gap-3.5 p-3 rounded-lg border border-card-border bg-surface-container-lowest">
            <Avatar
              name={editName || 'User'}
              src={editAvatar}
              size={52}
              className="ring-1 ring-card-border shrink-0"
            />
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-container border border-card-border hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
                >
                  <Upload size={12} />
                  <span>Upload Image</span>
                </button>
                {editAvatar && (
                  <button
                    type="button"
                    onClick={() => setEditAvatar('')}
                    className="text-xs font-medium text-error hover:underline transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              <span className="text-[11px] text-on-surface-variant/70">JPG, PNG or WEBP (Max 5MB)</span>
            </div>
          </div>
        </div>

        {/* Preset Avatars Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-on-surface">Or choose an avatar preset</span>
          <div className="flex items-center gap-2 p-2 rounded-lg border border-card-border bg-surface-container-lowest overflow-x-auto">
            {AVATAR_PRESETS.map((preset, idx) => (
              <button
                key={preset}
                type="button"
                onClick={() => setEditAvatar(preset)}
                className={cn(
                  'rounded-full p-0.5 border-2 transition-all cursor-pointer shrink-0',
                  editAvatar === preset
                    ? 'border-primary ring-2 ring-primary/20 scale-105'
                    : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                )}
                title={`Preset ${idx + 1}`}
              >
                <Avatar name={`Preset ${idx + 1}`} src={preset} size={28} />
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields: Full Name & Username */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface">
              Full Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter your full name"
              required
              className="h-10 w-full rounded-lg bg-surface-container-lowest border border-card-border px-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 shadow-2xs transition-colors focus:border-primary focus:ring-1 focus:ring-primary/25 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface">
                Username <span className="text-error">*</span>
              </label>
              <span className="text-[11px] text-on-surface-variant/70 font-mono">quicklearnit.com/@{editUsername || 'handle'}</span>
            </div>
            <div className="flex rounded-lg border border-card-border bg-surface-container-lowest shadow-2xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/25 overflow-hidden transition-colors">
              <span className="inline-flex items-center px-3 bg-surface-container-low border-r border-card-border text-xs font-mono font-medium text-on-surface-variant select-none">
                @
              </span>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                required
                className="h-10 w-full bg-transparent px-3 text-sm font-mono text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
              />
            </div>
            <span className="text-[11px] text-on-surface-variant/70">
              Visible on your public profile and uploaded study materials.
            </span>
          </div>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 rounded-lg bg-error-container/20 border border-error/30 p-2.5 text-xs text-error">
            <AlertCircle size={15} className="shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-2 pt-3 border-t border-card-border/60 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
