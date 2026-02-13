import { type ReactNode } from "react";
import { cn } from "../utils/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const GlassCard = ({
  children,
  className,
  onClick,
  interactive = false,
}: GlassCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-panel transition-all duration-300",
        interactive &&
          "hover:bg-white hover:scale-[1.02] cursor-pointer hover:shadow-xl hover:border-blue-100 active:scale-95",
        className,
      )}
    >
      {children}
    </div>
  );
};
