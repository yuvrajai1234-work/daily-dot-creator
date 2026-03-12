import React from "react";
import { cn } from "@/lib/utils";

interface BCoinIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const BCoinIcon = ({ className, size = "sm" }: BCoinIconProps) => {
  const sizeClasses = {
    sm: "w-4 h-4 text-[8px]",
    md: "w-5 h-5 text-[10px]",
    lg: "w-6 h-6 text-xs",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0",
        sizeClasses[size],
        className
      )}
    >
      B
    </div>
  );
};

export default BCoinIcon;
