"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronLeft, MapPin } from "lucide-react";

export interface LocationItem {
  code: string;
  name: string;
  isPinned?: boolean;
}

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: LocationItem[];
  onSelect: (item: LocationItem) => void;
}

export function LocationPickerModal({
  isOpen,
  onClose,
  title,
  items,
  onSelect,
}: LocationPickerModalProps) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const pinnedItems = useMemo(() => {
    return filteredItems.filter(item => item.isPinned);
  }, [filteredItems]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, LocationItem[]> = {};
    filteredItems.forEach((item) => {
      if (item.isPinned) return;
      const firstLetter = item.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(item);
    });
    // Sort items within each group
    for (const key in groups) {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, [filteredItems]);

  const sortedLetters = Object.keys(groupedItems).sort();

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col bg-white"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-slate-900 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <div className="w-10" />
        </div>

        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 placeholder:text-gray-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex bg-white">
          <div className="flex-1 overflow-y-auto pb-20 p-4 scroll-smooth">
            {filteredItems.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No locations found.
              </div>
            ) : (
              <>
                {pinnedItems.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-blue-600 mb-2 sticky top-0 bg-white py-1 z-10 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Pinned
                    </h3>
                    <div className="flex flex-col">
                      {pinnedItems.map((item) => (
                        <button
                          key={item.code}
                          onClick={() => onSelect(item)}
                          className="text-left py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors text-slate-900 font-medium bg-blue-50/50 border border-blue-100/50"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {sortedLetters.map((letter) => (
                  <div key={letter} id={`letter-${letter}`} className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 mb-2 sticky top-0 bg-white py-1 z-10">
                      {letter}
                    </h3>
                    <div className="flex flex-col">
                      {groupedItems[letter].map((item) => (
                        <button
                          key={item.code}
                          onClick={() => onSelect(item)}
                          className="text-left py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors text-slate-900 font-medium"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="w-8 flex flex-col items-center justify-center py-4 bg-white border-l border-gray-100 sticky right-0">
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
              <button
                key={letter}
                onClick={() => scrollToLetter(letter)}
                className={`text-[10px] w-full py-[3px] hover:text-blue-600 transition-colors ${
                  sortedLetters.includes(letter)
                    ? "text-gray-600 font-bold"
                    : "text-gray-300"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
