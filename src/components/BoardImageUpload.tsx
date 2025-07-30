import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BoardImageUploadProps {
  boardId: string;
  currentImageUrl?: string;
  onImageUpdate: (newUrl: string | null) => void;
}

const BoardImageUpload = ({ 
  boardId, 
  currentImageUrl, 
  onImageUpdate 
}: BoardImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `boards/${boardId}/cover.${fileExt}`;
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('pin-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('pin-images')
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;

      // Update the board's cover image
      const { error: updateError } = await supabase
        .from('boards')
        .update({ cover_image_url: imageUrl })
        .eq('id', boardId);

      if (updateError) {
        throw updateError;
      }

      onImageUpdate(imageUrl);
      
      toast({
        title: "Board cover updated!",
        description: "Your board cover image has been updated successfully.",
      });
      
    } catch (error: any) {
      console.error('Error uploading board image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload board cover image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    try {
      setRemoving(true);

      // Update the board to remove cover image
      const { error } = await supabase
        .from('boards')
        .update({ cover_image_url: null })
        .eq('id', boardId);

      if (error) {
        throw error;
      }

      onImageUpdate(null);
      
      toast({
        title: "Cover image removed",
        description: "Board cover image has been removed successfully.",
      });
      
    } catch (error: any) {
      console.error('Error removing board image:', error);
      toast({
        title: "Remove failed",
        description: error.message || "Failed to remove board cover image",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max for board covers)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    uploadImage(file);
    
    // Reset the input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {currentImageUrl ? (
        <div className="relative group">
          <div className="aspect-[3/1] w-full rounded-xl overflow-hidden bg-muted">
            <img 
              src={currentImageUrl} 
              alt="Board cover"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Change
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={removeImage}
                disabled={removing}
                className="rounded-full"
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="aspect-[3/1] w-full rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Add cover image</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-full"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {currentImageUrl ? 'Change Cover' : 'Add Cover'}
            </>
          )}
        </Button>
        
        {currentImageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={removeImage}
            disabled={removing}
            className="rounded-full"
          >
            {removing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Removing...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Remove Cover
              </>
            )}
          </Button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default BoardImageUpload;