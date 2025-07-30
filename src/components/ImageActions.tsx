import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ImageActionsProps {
  imageUrl: string;
  title: string;
  className?: string;
}

const ImageActions = ({ imageUrl, title, className = "" }: ImageActionsProps) => {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract file extension or default to jpg
      const extension = imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
      link.download = fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Your image is being downloaded.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Could not download the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
        className="rounded-full hover-scale bg-white/90 hover:bg-white text-foreground dark:bg-background/90 dark:hover:bg-background shadow-lg"
      >
        {downloading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
      
{/*       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hover-scale bg-white/90 hover:bg-white text-foreground dark:bg-background/90 dark:hover:bg-background shadow-lg"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="animate-fade-in">
          <DropdownMenuItem onClick={handleDownload} disabled={downloading}>
            <Download className="mr-2 h-4 w-4" />
            {downloading ? "Downloading..." : "Download Image"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open(imageUrl, '_blank')}>
            <span className="mr-2">🔗</span>
            Open in New Tab
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}
    </div>
  );
};

export default ImageActions;
