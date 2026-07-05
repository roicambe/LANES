import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ChevronUp, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./Input";

export interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD format expected
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
  disabled?: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  ({ label, value, onChange, className, disabled }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Date logic
    const parsedDate = value ? new Date(value + 'T12:00:00Z') : null; // UTC to avoid timezone shifts
    const today = new Date();
    
    const [currentMonth, setCurrentMonth] = useState(parsedDate ? parsedDate.getMonth() : today.getMonth());
    const [currentYear, setCurrentYear] = useState(parsedDate ? parsedDate.getFullYear() : today.getFullYear());
    
    // Quick selector state
    const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

    useEffect(() => {
      if (value) {
        const d = new Date(value + 'T12:00:00Z');
        if (!isNaN(d.getTime())) {
          setCurrentMonth(d.getMonth());
          setCurrentYear(d.getFullYear());
        }
      }
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setShowMonthYearPicker(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDayClick = (day: number) => {
      const newDate = new Date(Date.UTC(currentYear, currentMonth, day));
      const dateString = newDate.toISOString().split('T')[0];
      onChange({ target: { value: dateString } });
      setIsOpen(false);
    };

    const handleClear = () => {
      onChange({ target: { value: "" } });
      setIsOpen(false);
    };

    const handleToday = () => {
      const now = new Date();
      const dateString = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().split('T')[0];
      onChange({ target: { value: dateString } });
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
      setIsOpen(false);
    };

    const stepMonth = (dir: 1 | -1) => {
      let newMonth = currentMonth + dir;
      let newYear = currentYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      } else if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
    };

    // Calendar grid calculation
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    // Format display value
    let displayValue = "";
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      // mm/dd/yyyy format for display
      const m = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
      const d = parsedDate.getDate().toString().padStart(2, '0');
      const y = parsedDate.getFullYear();
      displayValue = `${m}/${d}/${y}`;
    }

    return (
      <div className={cn("relative", className)} ref={containerRef}>
        <div onClick={() => !disabled && setIsOpen(!isOpen)}>
          <Input
            label={label}
            value={displayValue}
            placeholder="mm/dd/yyyy"
            readOnly
            disabled={disabled}
            rightIcon={<CalendarIcon className="w-4 h-4 text-gray-500" />}
            className={cn("cursor-pointer bg-white", disabled && "cursor-not-allowed")}
            // Dummy onChange to avoid React warnings for readOnly without onChange
            onChange={() => {}} 
          />
        </div>

        {isOpen && (
          <div className="absolute left-0 mt-1 top-full z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
                className="font-semibold text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
              >
                {MONTHS[currentMonth]} {currentYear}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepMonth(-1)}
                  className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => stepMonth(1)}
                  className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Month/Year Selector Overlay */}
            {showMonthYearPicker ? (
              <div className="p-3 grid grid-cols-2 gap-4 h-[240px] overflow-y-auto">
                <div className="flex flex-col space-y-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Month</div>
                  {MONTHS.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => { setCurrentMonth(idx); setShowMonthYearPicker(false); }}
                      className={cn(
                        "text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                        currentMonth === idx ? "bg-blue-600 text-white font-medium" : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col space-y-1 overflow-y-auto h-full pr-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1 sticky top-0 bg-white">Year</div>
                  {Array.from({ length: 100 }, (_, i) => today.getFullYear() - 50 + i).map(y => (
                    <button
                      key={y}
                      onClick={() => { setCurrentYear(y); setShowMonthYearPicker(false); }}
                      className={cn(
                        "text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                        currentYear === y ? "bg-blue-600 text-white font-medium" : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-1 p-3 pb-2 text-center">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 px-3 pb-3">
                  {days.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="w-8 h-8" />;
                    
                    const isSelected = parsedDate && 
                      parsedDate.getDate() === day && 
                      parsedDate.getMonth() === currentMonth && 
                      parsedDate.getFullYear() === currentYear;
                      
                    const isToday = 
                      today.getDate() === day && 
                      today.getMonth() === currentMonth && 
                      today.getFullYear() === currentYear;

                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors",
                          isSelected 
                            ? "bg-blue-600 text-white font-semibold shadow-md" 
                            : "hover:bg-gray-100 text-gray-700",
                          !isSelected && isToday && "text-blue-600 font-bold bg-blue-50"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50/50">
                  <button 
                    onClick={handleClear}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={handleToday}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Today
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
