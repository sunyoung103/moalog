import React from 'react';

interface DonutGaugeProps {
  score: number; // 0 ~ 100
  title: string;
  subtitle?: string;
  subValue?: string;
  description: string;
  badgeText?: string;
  colorScheme?: 'indigo' | 'amber' | 'emerald' | 'teal' | 'purple' | 'rose';
  icon?: React.ReactNode;
  size?: number; // width/height of donut in px, default 76
}

export const DonutGauge: React.FC<DonutGaugeProps> = ({
  score,
  title,
  subtitle,
  subValue,
  description,
  badgeText,
  colorScheme = 'indigo',
  icon,
  size = 76,
}) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorStyles = {
    indigo: {
      stroke: 'stroke-indigo-600',
      track: 'stroke-stone-100',
      text: 'text-indigo-700',
      bg: 'bg-indigo-50/80',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200/80',
      border: 'border-stone-200/80',
    },
    amber: {
      stroke: 'stroke-amber-500',
      track: 'stroke-stone-100',
      text: 'text-amber-700',
      bg: 'bg-amber-50/80',
      badge: 'bg-amber-100 text-amber-800 border-amber-200/80',
      border: 'border-stone-200/80',
    },
    emerald: {
      stroke: 'stroke-emerald-600',
      track: 'stroke-stone-100',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50/80',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
      border: 'border-stone-200/80',
    },
    teal: {
      stroke: 'stroke-teal-600',
      track: 'stroke-stone-100',
      text: 'text-teal-700',
      bg: 'bg-teal-50/80',
      badge: 'bg-teal-100 text-teal-800 border-teal-200/80',
      border: 'border-stone-200/80',
    },
    purple: {
      stroke: 'stroke-purple-600',
      track: 'stroke-stone-100',
      text: 'text-purple-700',
      bg: 'bg-purple-50/80',
      badge: 'bg-purple-100 text-purple-800 border-purple-200/80',
      border: 'border-stone-200/80',
    },
    rose: {
      stroke: 'stroke-rose-600',
      track: 'stroke-stone-100',
      text: 'text-rose-700',
      bg: 'bg-rose-50/80',
      badge: 'bg-rose-100 text-rose-800 border-rose-200/80',
      border: 'border-stone-200/80',
    },
  };

  const currentTheme = colorStyles[colorScheme] || colorStyles.indigo;

  return (
    <div className={`p-4 rounded-3xl bg-white border ${currentTheme.border} space-y-3 shadow-xs hover:shadow-md transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className={`w-7 h-7 rounded-xl ${currentTheme.bg} ${currentTheme.text} flex items-center justify-center shrink-0 border border-stone-200/50`}>
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-black text-stone-900 truncate">{title}</h4>
            {subtitle && <p className="text-[10px] text-stone-400 font-medium truncate">{subtitle}</p>}
          </div>
        </div>

        {badgeText && (
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${currentTheme.badge} shrink-0`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Main Content Card: Clean Ring Gauge & Photo Analysis Spec */}
      <div className="flex items-center gap-3.5 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/70">
        {/* SVG Clean Circular Gauge */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
          <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
            {/* Background Track Circle */}
            <circle
              className={currentTheme.track}
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />

            {/* Primary Arc with Round Cap */}
            <circle
              className={`${currentTheme.stroke} transition-all duration-1000 ease-out`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
          </svg>

          {/* Center Text with Big Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className={`font-mono text-sm font-black ${currentTheme.text} leading-none tracking-tight`}>
              {score}%
            </span>
            <span className="text-[7px] font-mono text-stone-400 font-bold uppercase leading-none mt-0.5">
              Match
            </span>
          </div>
        </div>

        {/* Text Details & Photo Analysis Specification */}
        <div className="min-w-0 flex-1 space-y-1">
          {subValue && (
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-900">
              <span className="truncate">{subValue}</span>
              <span className={`text-[10px] font-mono font-bold ${currentTheme.text}`}>
                {score}/100
              </span>
            </div>
          )}

          <p className="text-[10px] text-stone-600 font-medium leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};


