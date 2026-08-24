import React from 'react';

interface RadarDataPoint {
  label: string;
  value: number; // 0 ~ 20
  fullMark: number; // 20
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  grade?: string;
  totalScore?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data = [],
  size = 240,
  grade = 'S',
  totalScore = 89,
}) => {
  const chartData = data || [];
  const count = chartData.length; // 5: 포즈, 배율, 시선, 배경, 선명도
  if (count === 0) return null;

  const radius = size * 0.36;
  const center = size / 2;
  const angleStep = (Math.PI * 2) / count;

  // Concentric ring levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper to compute (x, y) given index and normalized value (0~1)
  const getCoordinates = (index: number, valNorm: number, rOffset = 0) => {
    // Start at top (-PI/2)
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * valNorm + rOffset;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle,
    };
  };

  // Build grid polygon strings
  const gridPolygons = levels.map((lvl) => {
    const points = chartData
      .map((_, i) => {
        const { x, y } = getCoordinates(i, lvl);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    return { lvl, points };
  });

  // Build data polygon points
  const dataPointsStr = chartData
    .map((item, i) => {
      const norm = Math.min(1, Math.max(0.12, item.value / item.fullMark));
      const { x, y } = getCoordinates(i, norm);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2 px-1 my-1">
      {/* Soft radial background glow behind chart */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-amber-500/5 to-transparent rounded-full blur-xl pointer-events-none" />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible relative z-10 filter drop-shadow-sm"
      >
        <defs>
          {/* Main Area Gradient */}
          <radialGradient id="radarAreaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.55" />
            <stop offset="65%" stopColor="#059669" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.25" />
          </radialGradient>

          {/* Stroke Gradient */}
          <linearGradient id="radarStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Drop Shadow for the polygon */}
          <filter id="polygonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#059669" floodOpacity="0.3" />
          </filter>

          {/* Badge Shadow */}
          <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Circle Boundary Guide */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="#FAFAF9"
          stroke="#E7E5E4"
          strokeWidth="1"
        />

        {/* 1. Concentric Grid Webs */}
        {gridPolygons.map(({ lvl, points }) => (
          <polygon
            key={lvl}
            points={points}
            fill={lvl === 1.0 ? 'rgba(245, 245, 244, 0.4)' : 'none'}
            stroke={lvl === 1.0 ? '#D6D3D1' : '#E7E5E4'}
            strokeWidth={lvl === 1.0 ? 1.5 : 1}
            strokeDasharray={lvl === 1.0 ? '' : '3 3'}
          />
        ))}

        {/* 2. Radial Axis Spokes */}
        {chartData.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <g key={`axis-${i}`}>
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#E7E5E4"
                strokeWidth={1.2}
              />
              {/* Spoke End Tip Dot */}
              <circle
                cx={x}
                cy={y}
                r={2.5}
                fill="#A8A29E"
              />
            </g>
          );
        })}

        {/* 3. Filled Data Polygon */}
        <polygon
          points={dataPointsStr}
          fill="url(#radarAreaGlow)"
          stroke="url(#radarStrokeGrad)"
          strokeWidth={2.8}
          strokeLinejoin="round"
          filter="url(#polygonGlow)"
          className="transition-all duration-700 ease-out"
        />

        {/* 4. Data Vertex Dots */}
        {chartData.map((item, i) => {
          const norm = Math.min(1, Math.max(0.12, item.value / item.fullMark));
          const { x, y } = getCoordinates(i, norm);
          return (
            <g key={`dot-${i}`} className="transition-all duration-500">
              {/* Outer Glow Circle */}
              <circle
                cx={x}
                cy={y}
                r={7}
                fill="#10B981"
                fillOpacity="0.2"
              />
              {/* Main Dot */}
              <circle
                cx={x}
                cy={y}
                r={4.5}
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth={2}
                className="drop-shadow-sm"
              />
              {/* Center White Core */}
              <circle
                cx={x}
                cy={y}
                r={1.5}
                fill="#FFFFFF"
              />
            </g>
          );
        })}

        {/* 5. Axis Label Pill Badges */}
        {chartData.map((item, i) => {
          const { x, y } = getCoordinates(i, 1.0, 24);

          const isCenter = Math.abs(x - center) < 12;
          const isLeft = x < center - 12;
          const textAnchor = isCenter ? 'middle' : isLeft ? 'end' : 'start';

          // Score ratio percentage
          const pct = Math.round((item.value / item.fullMark) * 100);

          return (
            <g key={`label-${i}`} transform={`translate(${x}, ${y})`}>
              <text
                textAnchor={textAnchor}
                dy="0.3em"
                className="text-[12px] font-black fill-stone-900 tracking-tight"
              >
                {item.label}
                <tspan className="fill-emerald-800 font-mono font-bold text-[11px] ml-1">
                  {' '}{item.value}점
                </tspan>
              </text>
            </g>
          );
        })}

        {/* 6. Center Score Badge */}
        <g transform={`translate(${center}, ${center})`} filter="url(#badgeShadow)">
          {/* Outer Ring */}
          <circle cx={0} cy={0} r={23} fill="#18181B" stroke="#F59E0B" strokeWidth={2} />
          <circle cx={0} cy={0} r={20} fill="#27272A" />
          
          {/* Grade Badge Text */}
          <text
            x={0}
            y={-3}
            textAnchor="middle"
            dy="0.3em"
            className="fill-amber-400 text-[14px] font-mono font-black tracking-tighter"
          >
            {grade}
          </text>
          
          {/* Total Score Text */}
          <text
            x={0}
            y={10}
            textAnchor="middle"
            className="fill-stone-300 text-[8px] font-mono font-bold tracking-tight"
          >
            {totalScore}점
          </text>
        </g>
      </svg>
    </div>
  );
};

