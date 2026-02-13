'use client';

import { useState, useRef } from 'react';
import { upload as uploadApi, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Camera, Loader2, X } from 'lucide-react';

type ImageUploadProps = {
  currentUrl?: string;
  fallback?: string;
  onUploaded: (url: string) => void;
  shape?: 'circle' | 'square';
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

export function ImageUpload({ currentUrl, fallback = '?', onUploaded, shape = 'circle', size = 'md' }: ImageUploadProps) {
  const { getToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const token = await getToken();
    if (!token) return;

    setUploading(true);
    try {
      const { url } = await uploadApi.image(token, file);
      setPreview(url);
      onUploaded(url);
      toast.success('Image uploaded');
    } catch (err) {
      setPreview(currentUrl || '');
      toast.error(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onUploaded('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative group">
        {shape === 'circle' ? (
          <Avatar className={sizeMap[size]}>
            <AvatarImage src={preview} />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {fallback}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={`${sizeMap[size]} rounded-xl bg-muted flex items-center justify-center overflow-hidden border`}>
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-muted-foreground text-xs font-semibold">{fallback}</span>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          </div>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          disabled={uploading}
        >
          <Camera className="h-3 w-3" />
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {preview && (
        <Button type="button" variant="ghost" size="sm" onClick={handleRemove} className="text-xs text-muted-foreground">
          <X className="h-3 w-3 mr-1" />Remove
        </Button>
      )}
    </div>
  );
}
