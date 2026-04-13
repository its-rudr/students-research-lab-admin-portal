import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { adminAPI } from "@/lib/adminApi";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, publicId?: string) => void;
  currentImage?: string;
  label?: string;
  required?: boolean;
  maxSize?: number; // in MB, default 10
}

export default function ImageUpload({
  onImageUpload,
  currentImage,
  label = "Upload Image",
  required = false,
  maxSize = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `File size must be less than ${maxSize}MB. Your file is ${fileSizeMB.toFixed(2)}MB.`,
      });
      return;
    }

    // Validate file type - only images
    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validImageTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Only image files (JPEG, PNG, GIF, WebP) are allowed.",
      });
      return;
    }

    try {
      setUploading(true);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("image", file);

      // Upload to backend using adminAPI service
      const data = await adminAPI.uploadImage(formData);

      if (data.success && data.data?.url) {
        setPreview(data.data.url);
        onImageUpload(data.data.url, data.data.public_id);

        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Trigger file select with the dropped file
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;

      const event = new Event("change", { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  return (
    <div className="w-full">
      <Label className="mb-2 block">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>

      <div
        className="relative w-full border-2 border-dashed border-border rounded-lg p-6 transition-colors hover:border-primary/50 cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          id="image-file-upload"
          name="image-file-upload"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {!preview ? (
          <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images (JPEG, PNG, GIF, WebP) up to {maxSize}MB
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="relative w-full">
            <div className="relative w-full h-48 bg-muted rounded overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              disabled={uploading}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            <p className="text-xs text-muted-foreground mt-2">
              Click to change or drag to replace
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
