"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface ForecastSlot {
  dt: number;
  time: string;
  temp: number;
  pop: number;
  condition: string;
  icon: string;
}

export function ForecastChart() {
  const [forecast, setForecast] = useState<ForecastSlot[]>([]);
  const [location, setLocation] = useState<string>("Pasig");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForecast() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/weather/forecast?count=8");
          if (res.ok) {
          const data = await res.json();
          setForecast(data.forecast || []);
          setLocation(data.location || "Pasig");
        }
      } catch (err) {
        console.error("Failed to fetch forecast:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full h-[250px] animate-pulse flex flex-col">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="flex-1 bg-gray-50 rounded-xl"></div>
      </div>
    );
  }

  // Fallback to mock data if the API fails or returns empty (e.g. no API key)
  const displayForecast = forecast.length > 0 ? forecast : [
    { dt: 1, time: new Date().toISOString(), temp: 30, pop: 10, condition: "Clouds", icon: "04d" },
    { dt: 2, time: new Date(Date.now() + 3 * 3600000).toISOString(), temp: 31, pop: 40, condition: "Rain", icon: "10d" },
    { dt: 3, time: new Date(Date.now() + 6 * 3600000).toISOString(), temp: 29, pop: 80, condition: "Rain", icon: "09d" },
    { dt: 4, time: new Date(Date.now() + 9 * 3600000).toISOString(), temp: 28, pop: 90, condition: "Thunderstorm", icon: "11d" },
    { dt: 5, time: new Date(Date.now() + 12 * 3600000).toISOString(), temp: 27, pop: 60, condition: "Rain", icon: "10n" },
    { dt: 6, time: new Date(Date.now() + 15 * 3600000).toISOString(), temp: 26, pop: 20, condition: "Clouds", icon: "04n" },
    { dt: 7, time: new Date(Date.now() + 18 * 3600000).toISOString(), temp: 28, pop: 0, condition: "Clear", icon: "01d" },
    { dt: 8, time: new Date(Date.now() + 21 * 3600000).toISOString(), temp: 31, pop: 0, condition: "Clear", icon: "01d" },
  ];

  // SVG dimensions
  const width = 800;
  const height = 150;
  const padding = 30;

  // Find min/max temp to scale the graph
  const temps = displayForecast.map((f) => f.temp);
  const minTemp = Math.min(...temps) - 2; // Add padding below
  const maxTemp = Math.max(...temps) + 2; // Add padding above

  const rangeTemp = maxTemp - minTemp;
  const pointSpacing = (width - padding * 2) / (displayForecast.length - 1);

  // Generate points for the line
  const points = displayForecast.map((f, i) => {
    const x = padding + i * pointSpacing;
    const y = height - padding - ((f.temp - minTemp) / rangeTemp) * (height - padding * 2);
    return { x, y, temp: f.temp, pop: f.pop, icon: f.icon, time: new Date(f.time) };
  });

  // Create SVG path
  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  // Create area path (line down to the bottom)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full overflow-hidden">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-sm font-semibold text-gray-800">24-Hour Forecast & Rain Probability</h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">{location}</span>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-[700px] w-full">
          <svg viewBox={`0 0 ${width} ${height + 60}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            <path d={areaPath} fill="url(#areaGradient)" />

            {/* Line Chart */}
            <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Points & Labels */}
            {points.map((p, i) => {
              const hour = p.time.getHours();
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour % 12 === 0 ? 12 : hour % 12;
              
              return (
                <g key={i}>
                  {/* Weather Icon (placed above the point) */}
                  <image 
                    href={`https://openweathermap.org/img/wn/${p.icon}.png`} 
                    x={p.x - 20} 
                    y={p.y - 45} 
                    width="40" 
                    height="40"
                  />
                  
                  {/* Temperature Text */}
                  <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#1f2937" fontSize="12" fontWeight="600">
                    {Math.round(p.temp)}°
                  </text>
                  
                  {/* Data Point Dot */}
                  <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2" />
                  
                  {/* Rain Probability Bar */}
                  {p.pop > 0 && (
                    <>
                      <rect 
                        x={p.x - 10} 
                        y={height - padding + 10} 
                        width="20" 
                        height={(p.pop / 100) * 30} 
                        fill="#60a5fa" 
                        rx="2"
                        opacity="0.6"
                      />
                      <text x={p.x} y={height - padding + 20 + ((p.pop / 100) * 30)} textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
                        {p.pop}%
                      </text>
                    </>
                  )}
                  
                  {/* Time Label (Bottom) */}
                  <text x={p.x} y={height + 50} textAnchor="middle" fill="#6b7280" fontSize="11" fontWeight="500">
                    {displayHour} {ampm}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
