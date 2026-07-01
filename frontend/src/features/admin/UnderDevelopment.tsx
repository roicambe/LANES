"use client";

import { Construction } from "lucide-react";

interface UnderDevelopmentProps {
  /** The name of the section being built, e.g. "Audit Trail". */
  sectionName: string;
  /** Optional short description shown below the title. */
  description?: string;
}

/**
 * UnderDevelopment
 *
 * A reusable placeholder component displayed on admin panel pages that
 * have not yet been implemented. Provides visual context to the developer
 * and any reviewer testing the admin shell.
 */
export default function UnderDevelopment({
  sectionName,
  description = "This section is actively being built. Check back soon.",
}: UnderDevelopmentProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-8">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-amber-500" />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{sectionName}</h1>

      {/* Under Development badge */}
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 mb-4 tracking-wide uppercase">
        Under Development
      </span>

      {/* Description */}
      <p className="text-gray-500 text-sm max-w-sm leading-relaxed">{description}</p>
    </div>
  );
}
