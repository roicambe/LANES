"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

      <div className="flex items-center gap-1">
        {headerActions}

        {isMobile ? (
          onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )
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

  // ── Mobile: full-screen slide-up sheet ────────────────────────────────────
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel-mobile"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            {/* Mobile header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
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

  // ── Desktop: draggable floating card ──────────────────────────────────────
  const isRight = anchor === "right";
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{
        x: isRight ? -initialPosition.x : initialPosition.x,
        y: initialPosition.y,
      }}
      className={cn(
        "absolute top-0 z-40 cursor-move",
        isRight ? "right-0" : "left-0"
      )}
    >
      <Card className="w-[340px] rounded-xl border border-gray-200 shadow-xl bg-white flex flex-col max-h-[calc(100vh-2rem)] overflow-visible">
        {/* Desktop header */}
        <CardHeader className="pb-3 pt-4 rounded-t-xl">
          {headerRow}

          {/* Collapsed summary slot */}
          <AnimatePresence>
            {isCollapsed && collapsedSummary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
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
              className="overflow-visible flex-1"
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
