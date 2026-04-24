import type { AxisDomain, AxisScale } from 'd3';
import { useMemo } from 'react';

import type { AxisTickFormatter } from '../../util/types';
import { getAxisTickItems, getScaleRange } from './axis.utils';

interface Props {
  scale: AxisScale<AxisDomain>;
  top?: number;
  tickCount?: number;
  tickFormat?: AxisTickFormatter;
  tickAngle?: number;
  label?: string;
}

const AxisBottom = ({ scale, top, tickCount = 10, tickFormat, tickAngle = 0, label }: Props) => {
  const ticks = useMemo(
    () => getAxisTickItems(scale, tickCount, tickFormat),
    [scale, tickCount, tickFormat],
  );
  const range = useMemo(() => getScaleRange(scale), [scale]);
  const tickTextAnchor = tickAngle === 0 ? 'middle' : tickAngle > 0 ? 'start' : 'end';
  const axisCenter = (range.start + range.end) / 2;

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
          <text
            fill="currentColor"
            y={9}
            dy="0.71em"
            textAnchor={tickTextAnchor}
            transform={tickAngle === 0 ? undefined : `rotate(${tickAngle})`}
          >
            {tick.label}
          </text>
        </g>
      ))}
      {label && (
        <text fill="currentColor" x={axisCenter} y={38} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
};

export default AxisBottom;
