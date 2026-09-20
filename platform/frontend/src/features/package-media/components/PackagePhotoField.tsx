import React, { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { processPackagePhoto } from '../image-processing/process-package-photo';

export interface PackagePhotoFieldProps {
  onPhotoSelected: (blob: Blob | null) => void;
}

export function PackagePhotoField({ onPhotoSelected }: PackagePhotoFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const processedBlob = await processPackagePhoto(file, { maxLongEdge: 1600, quality: 0.8 });
      
      const url = URL.createObjectURL(processedBlob);
      setPreviewUrl(url);
      onPhotoSelected(processedBlob);
    } catch (error) {
      console.error('Failed to process photo', error);
      alert('Failed to process photo. Please try again.');
    } finally {
      setIsProcessing(false);
      // Reset input so the same file can be selected again if removed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onPhotoSelected(null);
  };

  return (
    <div className="pd-form-group">
      <label className="pd-label">Package Photo (Optional)</label>
      
      {!previewUrl ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="pd-button pd-button-secondary w-full flex items-center justify-center py-8 border-2 border-dashed border-[var(--pd-border)]"
          disabled={isProcessing}
        >
          <Camera className="w-8 h-8 mr-2 text-[var(--pd-text-muted)]" />
          <span className="text-[var(--pd-text-muted)]">
            {isProcessing ? 'Processing...' : 'Tap to take photo'}
          </span>
        </button>
      ) : (
        <div className="relative rounded-[var(--pd-radius-lg)] overflow-hidden border border-[var(--pd-border)]">
          <img src={previewUrl} alt="Package preview" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
