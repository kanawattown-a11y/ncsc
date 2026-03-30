"use client";

import React from "react";

interface ChartData {
  name: string;
  value: number;
}

export function SecurityPieChart({ data }: { data: ChartData[] }) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercent = 0;

  function getCoordinatesForPercent(percent: number) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="-1 -1 2 2" style={{ transform: "rotate(-90deg)" }}>
        {data.map((item, index) => {
          const startPercent = cumulativePercent;
          const iconPercent = item.value / total;
          cumulativePercent += iconPercent;

          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = iconPercent > 0.5 ? 1 : 0;

          const colors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
          const color = colors[index % colors.length];

          return (
            <path
              key={index}
              d={`M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`}
              fill={color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          );
        })}
        <circle cx="0" cy="0" r="0.6" fill="#111827" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-[10px] text-gray-500 uppercase">سجل</span>
      </div>
    </div>
  );
}

export function SecurityBarChart({ data }: { data: { date: string, count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 100;
  
  return (
    <div className="w-full h-40 flex items-end gap-2 px-2">
      {data.map((item, index) => {
        const height = (item.count / max) * chartHeight;
        return (
          <div key={index} className="flex-1 flex flex-col items-center group">
            <div 
              className="w-full bg-[#2563EB]/40 border-t-2 border-[#2563EB] rounded-t-sm transition-all group-hover:bg-[#2563EB]/60" 
              style={{ height: `${height}%` }}
            ></div>
            <span className="text-[8px] text-gray-500 mt-2 rotate-45 md:rotate-0">
               {new Date(item.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
