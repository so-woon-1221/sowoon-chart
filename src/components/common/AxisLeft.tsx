import type { AxisDomain, AxisScale } from 'd3';
import { useMemo } from 'react';

import type { AxisTickFormatter } from '../../util/types';
import { getAxisTickItems, getScaleRange } from './axis.utils';

interface Props {
  scale: AxisScale<AxisDomain>;
  left?: number;
  tickCount?: number;
  tickFormat?: AxisTickFormatter;
  label?: string;
}

const AxisLeft = ({ scale, left, tickCount = 10, tickFormat, label }: Props) => {
  const ticks = useMemo(
    () => getAxisTickItems(scale, tickCount, tickFormat),
    [scale, tickCount, tickFormat],
  );
  const range = useMemo(() => getScaleRange(scale), [scale]);
  const axisCenter = (range.start + range.end) / 2;

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
      {label && (
        <text
          fill="currentColor"
          textAnchor="middle"
          transform={`translate(-42, ${axisCenter}) rotate(-90)`}
        >
          {label}
        </text>
      )}
    </g>
  );
};

export default AxisLeft;
