import * as React from 'react';

export interface IGaugeChartProps {
  value: number;
  min: number;
  max: number;
  target?: number;
  color: string;
}

const SIZE = 220;
const STROKE = 22;
const CENTER = SIZE / 2;
const RADIUS = CENTER - STROKE;
const START_ANGLE = 180;
const SWEEP = 180;

function polarToCartesian(angleDeg: number): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(angleRad),
    y: CENTER + RADIUS * Math.sin(angleRad)
  };
}

function describeArc(startDeg: number, endDeg: number): string {
  const start = polarToCartesian(startDeg);
  const end = polarToCartesian(endDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

const GaugeChart: React.FC<IGaugeChartProps> = ({ value, min, max, target, color }) => {
  const clamped = Math.max(min, Math.min(max, value));
  const pct = max > min ? (clamped - min) / (max - min) : 0;
  const valueAngle = START_ANGLE + SWEEP * pct;

  const targetAngle =
    typeof target === 'number' && max > min
      ? START_ANGLE + SWEEP * Math.max(0, Math.min(1, (target - min) / (max - min)))
      : undefined;

  return (
    <svg width="100%" viewBox={`0 0 ${SIZE} ${SIZE / 2 + 40}`} role="img" aria-label={`Gauge showing ${value} of ${max}`}>
      <path
        d={describeArc(START_ANGLE, START_ANGLE + SWEEP)}
        fill="none"
        stroke="#eef0f3"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d={describeArc(START_ANGLE, valueAngle)}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      {targetAngle !== undefined && (
        <line
          x1={CENTER + (RADIUS - STROKE) * Math.cos((targetAngle * Math.PI) / 180)}
          y1={CENTER + (RADIUS - STROKE) * Math.sin((targetAngle * Math.PI) / 180)}
          x2={CENTER + (RADIUS + STROKE) * Math.cos((targetAngle * Math.PI) / 180)}
          y2={CENTER + (RADIUS + STROKE) * Math.sin((targetAngle * Math.PI) / 180)}
          stroke="#33373d"
          strokeWidth={3}
        />
      )}
      <text x={CENTER} y={CENTER - 6} textAnchor="middle" fontSize="30" fontWeight="700" fill="#1b1b1f">
        {clamped.toLocaleString()}
      </text>
      <text x={CENTER} y={CENTER + 18} textAnchor="middle" fontSize="12" fill="#8a8f98">
        {min.toLocaleString()} – {max.toLocaleString()}
      </text>
    </svg>
  );
};

export default GaugeChart;
