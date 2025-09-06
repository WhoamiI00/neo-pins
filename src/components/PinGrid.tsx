import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PinCard from "./PinCard";
import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate } from "framer-motion";

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
  currentUserId?: string;
  onPinDeleted?: (pinId: string) => void;
}

const PinGrid = ({ pins, onPinClick, className, currentUserId, onPinDeleted }: PinGridProps) => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const emptyStateVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  if (pins.length === 0) {
    return (
      <motion.div 
        className="flex items-center justify-center py-16"
        variants={emptyStateVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          <motion.div 
            className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4"
            whileHover={{ scale: 1.1, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-2xl">📌</span>
          </motion.div>
          <motion.h3 
            className="text-lg font-medium mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            No pins yet
          </motion.h3>
          <motion.p 
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Start creating pins to see them here!
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={cn("w-full px-4", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="grid gap-4"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {columnArrays.map((columnPins, columnIndex) => (
            <motion.div
              key={columnIndex} 
              className="space-y-4"
              initial={{ opacity: 0, x: columnIndex % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: columnIndex * 0.1,
                type: "spring" as const,
                stiffness: 100,
                damping: 15
              }}
            >
              {columnPins.map((pin, pinIndex) => (
                <motion.div
                  key={pin.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: (columnIndex * 0.05) + (pinIndex * 0.1),
                    type: "spring" as const,
                    stiffness: 80,
                    damping: 12
                  }}
                >
                <PinCard
                  pin={pin}
                  onClick={() => {
                    navigate(`/pin/${pin.id}`);
                    onPinClick?.(pin);
                  }}
                  className="w-full"
                  currentUserId={currentUserId}
                  onPinDeleted={onPinDeleted}
                />
              </motion.div>
            ))}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default PinGrid;