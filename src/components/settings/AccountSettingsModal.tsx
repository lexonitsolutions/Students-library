import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Camera, Upload } from 'lucide-react';
import { uploadAvatar } from '../../services/profileService';
import { resizeImageFile } from '../../lib/imageUtils';

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

  useEffect(() => {
    if (user && open) {
      setEditName(user.name);
      setEditUsername(user.username ?? user.name.toLowerCase().replace(/\s+/g, ''));
      setEditAvatar(user.avatar);
      setEditCover(user.coverImage ?? '');
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
    if (!user) return;
    await updateUser({
      name: editName,
      username: editUsername,
      avatar: editAvatar,
      coverImage: editCover,
    });
    onClose();
  };

  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Personal Information">
      <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 py-2">
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

          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-surface-container-high mb-4 group flex items-center justify-center cursor-pointer" onClick={() => coverInputRef.current?.click()}>
            {editCover ? (
              <img src={editCover} alt="Cover" className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
            ) : (
              <span className="text-on-surface-variant flex flex-col items-center gap-2"><Upload size={20}/> Upload Cover Image</span>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera size={24} />
            </div>
          </div>

          <div className="relative cursor-pointer group -mt-16" onClick={() => fileInputRef.current?.click()}>
            <Avatar name={editName || 'User'} src={editAvatar} size={88} className="transition-opacity group-hover:opacity-80 ring-4 ring-surface" />
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md group-hover:scale-110 transition-transform">
              <Camera size={16} />
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Upload size={14} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Photo from Gallery
          </Button>

          <div className="mt-2 flex flex-col items-center gap-1.5 w-full">
            <p className="text-label-sm text-on-surface-variant font-medium">Or select a preset avatar</p>
            <div className="flex gap-2">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEditAvatar(preset)}
                  className={`rounded-full p-0.5 border-2 transition-all cursor-pointer ${
                    editAvatar === preset ? 'border-primary scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Avatar name={`Preset ${idx + 1}`} src={preset} size={32} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <Input
          label="Full Name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Enter your full name"
          required
        />

        <Input
          label="Username (Displayed on Home Page)"
          value={editUsername}
          onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
          placeholder="e.g. davood_dev"
          required
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
