"use client";

import { type ReactNode, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/Card";
import { cn } from "@/lib/utils";

interface PanelProps {
  /** Text shown in the card header. */
  title: string;
  /** Icon element rendered inside the icon badge. */
  icon: ReactNode;
  /** Tailwind bg class for the icon badge (e.g. "bg-blue-100"). */
  iconBgClassName?: string;
  /**
   * Extra controls rendered right-of-title (before the chevron).
   * e.g. a "Clear" text button.
   */
  headerActions?: ReactNode;
  /**
   * Content shown inside the header when the panel is collapsed.
   * Only rendered on desktop; ignored on mobile.
   */
  collapsedSummary?: ReactNode;
  /** Whether the panel body is collapsed (desktop only). */
  isCollapsed: boolean;
  /** Called when the collapse toggle chevron is clicked (desktop). */
  onCollapseToggle: () => void;
  /** Whether we are rendering in a mobile viewport. */
  isMobile: boolean;
  /**
   * Controls mobile slide-up visibility.
   * Ignored on desktop (desktop card is always visible).
   */
  isOpen?: boolean;
  /** Called when the mobile close (X) button is pressed. */
  onClose?: () => void;
  /**
   * Which edge of the map the panel is anchored to.
   * Defaults to "left". When "right", the drag wrapper uses `right-0`
   * and `initialPosition.x` is treated as the distance from the right edge.
   */
  anchor?: "left" | "right";
  /**
   * Initial {x, y} position of the draggable desktop card.
   * Defaults to { x: 16, y: 80 }.
   */
  initialPosition?: { x: number; y: number };
  /** Main panel body content. Rendered inside CardContent on desktop. */
  children: ReactNode;
}

/**
 * Shared shell for map-side floating panels.
 *
 * Desktop: renders a draggable card anchored at `initialPosition`.
 * Mobile:  renders a full-screen slide-up sheet controlled by `isOpen`.
 *
 * Consumers supply the body content via `children`.
 */
export function Panel({
  title,
  icon,
  iconBgClassName = "bg-gray-100",
  headerActions,
  collapsedSummary,
  isCollapsed,
  onCollapseToggle,
  isMobile,
  isOpen = true,
  onClose,
  anchor = "left",
  initialPosition = { x: 16, y: 80 },
  children,
}: PanelProps) {
  const dragControls = useDragControls();
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragControls.start(e.nativeEvent);
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 5) return;
    onCollapseToggle();
  };

  // ── Shared header markup ──────────────────────────────────────────────────
  const headerRow = (
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2 text-base">
        <div
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
            iconBgClassName
          )}
        >
          {icon}
        </div>
        <span>{title}</span>
      </CardTitle>

      <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        {headerActions}

        {isMobile ? (
          <button
            type="button"
            onClick={onCollapseToggle}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={isCollapsed ? "Expand panel" : "Minimize panel"}
          >
            {isCollapsed ? (
              <ChevronUp className="w-6 h-6 text-gray-500" />
            ) : (
              <ChevronDown className="w-6 h-6 text-gray-500" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onCollapseToggle}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  const handleMobileHeaderClick = (e: React.MouseEvent) => {
    if (!isCollapsed) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 5) return;
    onCollapseToggle();
  };

  // ── Mobile: draggable bottom sheet ────────────────────────────────────────
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel-mobile"
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 600 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 60 && !isCollapsed) {
                onCollapseToggle();
              } else if (info.offset.y < -60 && isCollapsed) {
                onCollapseToggle();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: isCollapsed ? "calc(100% - 64px)" : 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 z-40 bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex flex-col border-t border-gray-200 overflow-hidden h-[60vh] overscroll-y-none"
          >
            {/* Drag Handle Bar */}
            <div 
              className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-2.5 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
              onPointerDown={handlePointerDown}
            />

            {/* Mobile header */}
            <div 
              className="px-4 pb-3 border-b border-gray-100 bg-gray-50/50 shrink-0 cursor-grab active:cursor-grabbing touch-none select-none"
              onPointerDown={handlePointerDown}
              onClick={handleMobileHeaderClick}
            >
              {headerRow}
            </div>

            {/* Mobile scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const isRight = anchor === "right";
  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{
        x: isRight ? -initialPosition.x : initialPosition.x,
        y: initialPosition.y,
      }}
      className={cn(
        "absolute top-0 z-40",
        isRight ? "right-0" : "left-0"
      )}
    >
      <Card className="w-[340px] rounded-xl border border-gray-200 shadow-xl bg-white flex flex-col max-h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Desktop header */}
        <CardHeader 
          className="pb-3 pt-4 rounded-t-xl cursor-move touch-none select-none transition-colors hover:bg-gray-50/50"
          onPointerDown={handlePointerDown}
          onClick={handleHeaderClick}
        >
          {headerRow}

          {/* Collapsed summary slot */}
          <AnimatePresence>
            {isCollapsed && collapsedSummary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="pt-2 overflow-hidden"
              >
                {collapsedSummary}
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        {/* Collapsible body */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-y-auto flex-1 min-h-0"
            >
              <CardContent className="space-y-4 pb-4">
                {children}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
