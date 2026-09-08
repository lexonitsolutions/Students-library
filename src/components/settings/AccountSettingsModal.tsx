import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Camera, AlertCircle, X } from 'lucide-react';
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
    <Modal open={open} onClose={onClose} title="Edit Personal Information">
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

        {/* Banner & Avatar Section */}
        <div className="relative">
          {/* Cover Banner Preview */}
          <div className="relative h-32 w-full rounded-xl overflow-hidden bg-surface-container-high border border-card-border/80 shadow-2xs">
            {editCover ? (
              <img src={editCover} alt="Cover Preview" className="h-full w-full object-cover object-center" />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-primary/15 via-indigo-500/10 to-surface-container-high" />
            )}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium px-2.5 py-1.5 backdrop-blur-md transition-all shadow-xs cursor-pointer"
              >
                <Camera size={13} />
                <span>{editCover ? 'Change banner' : 'Add banner'}</span>
              </button>
              {editCover && (
                <button
                  type="button"
                  onClick={() => setEditCover('')}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-xs cursor-pointer"
                  title="Remove banner"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Avatar & Photo Action Row */}
          <div className="flex items-end gap-3.5 px-2 -mt-9 mb-3">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload profile photo"
            >
              <Avatar
                name={editName || 'User'}
                src={editAvatar}
                size={72}
                className="ring-4 ring-surface shadow-md bg-surface"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={20} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white ring-2 ring-surface shadow-xs group-hover:scale-110 transition-transform">
                <Camera size={12} />
              </div>
            </div>

            <div className="flex flex-col gap-0.5 pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  Upload Photo
                </button>
                {editAvatar && (
                  <>
                    <span className="text-on-surface-variant/30 text-xs">•</span>
                    <button
                      type="button"
                      onClick={() => setEditAvatar('')}
                      className="text-xs font-medium text-error hover:underline transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
              <span className="text-[11px] text-on-surface-variant/70">JPG, PNG or WEBP · Max 5MB</span>
            </div>
          </div>
        </div>

        {/* Preset Avatars Selector */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-container-high/30 border border-card-border/60 text-xs">
          <span className="text-[11px] text-on-surface-variant font-medium shrink-0">Avatar presets:</span>
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {AVATAR_PRESETS.map((preset, idx) => (
              <button
                key={preset}
                type="button"
                onClick={() => setEditAvatar(preset)}
                className={cn(
                  'rounded-full p-0.5 border-2 transition-all cursor-pointer shrink-0',
                  editAvatar === preset
                    ? 'border-primary scale-110 shadow-xs'
                    : 'border-transparent opacity-70 hover:opacity-100'
                )}
                title={`Preset ${idx + 1}`}
              >
                <Avatar name={`Preset ${idx + 1}`} src={preset} size={26} />
              </button>
            ))}
          </div>
        </div>

        {/* Name & Username Inputs */}
        <div className="flex flex-col gap-3.5 mt-1">
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
              className="h-11 w-full rounded-xl bg-surface-container-lowest border border-card-border/90 px-3.5 text-sm font-medium text-on-surface placeholder:text-outline/50 shadow-2xs transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface">
                Username <span className="text-error">*</span>
              </label>
              <span className="text-[11px] text-on-surface-variant/70">Public handle</span>
            </div>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3.5 text-sm font-semibold text-on-surface-variant/50 select-none">
                @
              </span>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                required
                className="h-11 w-full rounded-xl bg-surface-container-lowest border border-card-border/90 pl-8 pr-3.5 text-sm font-medium text-on-surface placeholder:text-outline/50 shadow-2xs transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono"
              />
            </div>
            <span className="text-[11px] text-on-surface-variant/70">
              Visible on your public profile and uploaded study materials.
            </span>
          </div>
        </div>

        {saveError && (
          <div className="flex items-center gap-2 rounded-lg bg-error-container/20 border border-error/30 p-3 text-body-sm text-error">
            <AlertCircle size={18} className="shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="mt-2 flex items-center justify-end gap-2.5 pt-3 border-t border-card-border/60">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
