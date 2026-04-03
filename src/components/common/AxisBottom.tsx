import { axisBottom, type AxisDomain, type AxisScale, select, type Selection } from 'd3';
import { useEffect, useRef } from 'react';

interface Props {
  scale: AxisScale<AxisDomain>;
  top?: number;
}

const AxisBottom = ({ scale, top }: Props) => {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const axis = select(ref.current) as Selection<SVGGElement, unknown, null, undefined>;
    axis.attr('transform', `translate(0, ${top ?? 0})`).call(axisBottom(scale));
  }, [scale, top]);

  return <g ref={ref} className="x-axis" />;
};

export default AxisBottom;
