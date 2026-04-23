import type { AxisDomain, AxisScale } from 'd3';
import { useMemo } from 'react';

import { getAxisTickItems, getScaleRange } from './axis.utils';

interface Props {
  scale: AxisScale<AxisDomain>;
  left?: number;
  tickCount?: number;
}

const AxisLeft = ({ scale, left, tickCount = 10 }: Props) => {
  const ticks = useMemo(() => getAxisTickItems(scale, tickCount), [scale, tickCount]);
  const range = useMemo(() => getScaleRange(scale), [scale]);

  return (
    <g
      className="y-axis"
      transform={`translate(${left ?? 0}, 0)`}
      fill="none"
      fontFamily="sans-serif"
      fontSize={10}
      textAnchor="end"
    >
      <path className="domain" stroke="currentColor" d={`M-6,${range.start}H0V${range.end}H-6`} />
      {ticks.map((tick) => (
        <g
          key={`${String(tick.value)}-${tick.offset}`}
          className="tick"
          transform={`translate(0,${tick.offset})`}
        >
          <line stroke="currentColor" x2={-6} />
          <text fill="currentColor" x={-9} dy="0.32em">
            {tick.label}
          </text>
        </g>
      ))}
    </g>
  );
};

export default AxisLeft;
