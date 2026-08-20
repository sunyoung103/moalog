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
  data,
  size = 220,
  grade = 'S',
  totalScore = 89,
}) => {
  const count = data.length; // usually 5: 포즈, 배율, 시선, 배경, 선명도
  const radius = size * 0.38;
  const center = size / 2;
  const angleStep = (Math.PI * 2) / count;

  // Levels for background grid polygons (20%, 40%, 60%, 80%, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Helper to compute (x, y) given index and normalized value (0~1)
  const getCoordinates = (index: number, valNorm: number, rOffset = 0) => {
    // Start at top (-PI/2)
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * valNorm + rOffset;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Build grid polygon strings
  const gridPolygons = levels.map((lvl) => {
    const points = data
      .map((_, i) => {
        const { x, y } = getCoordinates(i, lvl);
        return `${x},${y}`;
      })
      .join(' ');
    return { lvl, points };
  });

  // Build data polygon points
  const dataPointsStr = data
    .map((item, i) => {
      const norm = Math.min(1, Math.max(0.1, item.value / item.fullMark));
      const { x, y } = getCoordinates(i, norm);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          {/* Radar Gradient */}
          <radialGradient id="radarAreaGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id="radarStrokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* 1. Background Grid Webs */}
        {gridPolygons.map(({ lvl, points }) => (
          <polygon
            key={lvl}
            points={points}
            fill={lvl === 1.0 ? '#F8FAF6' : 'none'}
            stroke="#E2E8F0"
            strokeWidth={lvl === 1.0 ? 1.5 : 1}
            strokeDasharray={lvl === 1.0 ? '' : '3 3'}
          />
        ))}

        {/* 2. Axis Lines from Center to Vertices */}
        {data.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth={1}
            />
          );
        })}

        {/* 3. Filled Data Area Polygon */}
        <polygon
          points={dataPointsStr}
          fill="url(#radarAreaGradient)"
          stroke="url(#radarStrokeGradient)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          className="transition-all duration-500 ease-out"
        />

        {/* 4. Data Vertex Dots with Values */}
        {data.map((item, i) => {
          const norm = Math.min(1, Math.max(0.1, item.value / item.fullMark));
          const { x, y } = getCoordinates(i, norm);
          return (
            <g key={`dot-${i}`}>
              <circle
                cx={x}
                cy={y}
                r={4}
                fill="#F59E0B"
                stroke="#FFFFFF"
                strokeWidth={2}
                className="shadow-md drop-shadow"
              />
            </g>
          );
        })}

        {/* 5. Axis Labels & Scores placed outside */}
        {data.map((item, i) => {
          const { x, y } = getCoordinates(i, 1.0, 22);
          // Determine text anchor based on x position relative to center
          const isCenter = Math.abs(x - center) < 10;
          const isLeft = x < center - 10;
          const textAnchor = isCenter ? 'middle' : isLeft ? 'end' : 'start';

          return (
            <g key={`label-${i}`} transform={`translate(${x}, ${y})`}>
              <text
                textAnchor={textAnchor}
                dy="0.3em"
                className="text-[13px] font-extrabold fill-stone-900"
              >
                {item.label}
                <tspan className="fill-emerald-700 font-mono font-black text-[12px] ml-1">
                  {' '}({item.value})
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Center Badge Grade & Total Score */}
        <circle cx={center} cy={center} r={21} fill="#18181b" className="shadow-lg stroke-amber-400 stroke-2" />
        <text
          x={center}
          y={center - 3}
          textAnchor="middle"
          dy="0.3em"
          className="fill-amber-400 text-[13px] font-mono font-black tracking-tight"
        >
          {grade}
        </text>
        <text
          x={center}
          y={center + 11}
          textAnchor="middle"
          className="fill-stone-200 text-[8px] font-mono font-bold"
        >
          {totalScore}점
        </text>
      </svg>
    </div>
  );
};
