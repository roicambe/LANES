import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-white text-gray-900 rounded-xl shadow-lg border border-gray-200 overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("px-4 py-3 border-b border-gray-100 bg-gray-50/50", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return <h2 className={cn("text-lg font-bold text-gray-900", className)}>{children}</h2>;
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
