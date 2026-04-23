import type { AxisDomain, AxisScale } from 'd3';
import { useMemo } from 'react';

import { getAxisTickItems, getScaleRange } from './axis.utils';

interface Props {
  scale: AxisScale<AxisDomain>;
  size: number;
  count?: number;
  left?: number;
}

const GridHorizontal = ({ scale, size, count = 4, left }: Props) => {
  const ticks = useMemo(() => getAxisTickItems(scale, count), [scale, count]);
  const range = useMemo(() => getScaleRange(scale), [scale]);

  return (
    <g
      transform={`translate(${left ?? 0}, 0)`}
      stroke="#e0e0e044"
      strokeWidth={0.5}
      strokeDasharray="2,2"
    >
      <path className="domain" fill="none" d={`M0,${range.start}V${range.end}`} />
      {ticks.map((tick) => (
        <line
          key={`${String(tick.value)}-${tick.offset}`}
          x1={0}
          x2={size}
          y1={tick.offset}
          y2={tick.offset}
        />
      ))}
    </g>
  );
};

export default GridHorizontal;
