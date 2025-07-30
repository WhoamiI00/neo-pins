import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewProfilePictureUploadProps {
  currentAvatarUrl?: string;
  userEmail: string;
  userId: string;
  onAvatarUpdate: (newUrl: string) => void;
}

const NewProfilePictureUpload = ({ 
  currentAvatarUrl, 
  userEmail, 
  userId, 
  onAvatarUpdate 
}: NewProfilePictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setUploading(true);
      await uploadProfilePicture(file);
    } catch (error) {
      console.error('Upload error:', error);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Clean up the object URL
      URL.revokeObjectURL(objectUrl);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      // Generate unique file name with timestamp
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile_${timestamp}.${fileExt}`;

      console.log('Starting upload process...');
      console.log('User ID:', userId);
      console.log('File name:', fileName);

      // Step 1: Clean up old files
      console.log('Cleaning up old files...');
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (listError) {
        console.warn('Could not list existing files:', listError);
      } else if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => `${userId}/${file.name}`);
        console.log('Deleting files:', filesToDelete);
        
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
          
        if (deleteError) {
          console.warn('Could not delete old files:', deleteError);
        }
      }

      // Step 2: Upload new file
      console.log('Uploading new file...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Step 3: Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL:', publicUrl);

      // Step 4: Update profile in database
      console.log('Updating profile in database...');
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log('Profile updated successfully:', updateData);

      // Step 5: Update UI
      onAvatarUpdate(publicUrl);
      setPreviewUrl(null);

      toast({
        title: "Profile picture updated!",
        description: "Your profile picture has been updated successfully.",
      });

    } catch (error: any) {
      console.error('Error in upload process:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center space-y-4 animate-fade-in">
      <div className="relative group">
        <Avatar className="w-24 h-24 cursor-pointer transition-all hover:scale-105" onClick={triggerFileInput}>
          <AvatarImage src={displayUrl} alt={userEmail} />
          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary/20 to-primary/40">
            {userEmail.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Hover overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
          onClick={triggerFileInput}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        {/* Loading indicator */}
        {uploading && (
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        )}
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={triggerFileInput}
        disabled={uploading}
        className="rounded-full hover-scale transition-all"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Change Picture
          </>
        )}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default NewProfilePictureUpload;