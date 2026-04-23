import type { AxisDomain, AxisScale } from 'd3';
import { useMemo } from 'react';

import { getAxisTickItems, getScaleRange } from './axis.utils';

interface Props {
  scale: AxisScale<AxisDomain>;
  size: number;
  count?: number;
  top?: number;
}

const GridVertical = ({ scale, size, count = 4, top }: Props) => {
  const ticks = useMemo(() => getAxisTickItems(scale, count), [scale, count]);
  const range = useMemo(() => getScaleRange(scale), [scale]);

  return (
    <g
      transform={`translate(0, ${top ?? 0})`}
      stroke="#e0e0e044"
      strokeWidth={0.5}
      strokeDasharray="2,2"
    >
      <path className="domain" fill="none" d={`M${range.start},0H${range.end}`} />
      {ticks.map((tick) => (
        <line
          key={`${String(tick.value)}-${tick.offset}`}
          x1={tick.offset}
          x2={tick.offset}
          y1={0}
          y2={-size}
        />
      ))}
    </g>
  );
};

export default GridVertical;
