import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PinCard from "./PinCard";
import { cn } from "@/lib/utils";

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  original_url?: string;
  user_id: string;
  board_id: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

interface PinGridProps {
  pins: Pin[];
  onPinClick?: (pin: Pin) => void;
  className?: string;
}

const PinGrid = ({ pins, onPinClick, className }: PinGridProps) => {
  const [columns, setColumns] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);      // mobile
      else if (width < 768) setColumns(3); // tablet
      else if (width < 1024) setColumns(4); // desktop
      else if (width < 1280) setColumns(5); // large desktop
      else setColumns(6);                   // xl desktop
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Distribute pins into columns for masonry layout
  const distributeIntoColumns = () => {
    const columnArrays: Pin[][] = Array.from({ length: columns }, () => []);
    
    pins.forEach((pin, index) => {
      const columnIndex = index % columns;
      columnArrays[columnIndex].push(pin);
    });
    
    return columnArrays;
  };

  const columnArrays = distributeIntoColumns();

  if (pins.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📌</span>
          </div>
          <h3 className="text-lg font-medium mb-2">No pins yet</h3>
          <p className="text-muted-foreground">Start creating pins to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full px-4", className)}>
      <div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {columnArrays.map((columnPins, columnIndex) => (
          <div key={columnIndex} className="space-y-4">
            {columnPins.map((pin) => (
              <PinCard
                key={pin.id}
                pin={pin}
                onClick={() => {
                  navigate(`/pin/${pin.id}`);
                  onPinClick?.(pin);
                }}
                className="w-full"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinGrid;