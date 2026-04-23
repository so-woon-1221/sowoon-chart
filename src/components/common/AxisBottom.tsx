import type { AxisDomain, AxisScale } from 'd3';
import { useMemo } from 'react';

import { getAxisTickItems, getScaleRange } from './axis.utils';

interface Props {
  scale: AxisScale<AxisDomain>;
  top?: number;
  tickCount?: number;
}

const AxisBottom = ({ scale, top, tickCount = 10 }: Props) => {
  const ticks = useMemo(() => getAxisTickItems(scale, tickCount), [scale, tickCount]);
  const range = useMemo(() => getScaleRange(scale), [scale]);

  return (
    <g
      className="x-axis"
      transform={`translate(0, ${top ?? 0})`}
      fill="none"
      fontFamily="sans-serif"
      fontSize={10}
      textAnchor="middle"
    >
      <path className="domain" stroke="currentColor" d={`M${range.start},6V0H${range.end}V6`} />
      {ticks.map((tick) => (
        <g
          key={`${String(tick.value)}-${tick.offset}`}
          className="tick"
          transform={`translate(${tick.offset},0)`}
        >
          <line stroke="currentColor" y2={6} />
          <text fill="currentColor" y={9} dy="0.71em">
            {tick.label}
          </text>
        </g>
      ))}
    </g>
  );
};

export default AxisBottom;
