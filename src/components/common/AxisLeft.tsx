import { useEffect, useRef } from "react";
import { AxisDomain, axisLeft, AxisScale, select, Selection } from "d3";

interface Props {
  scale: AxisScale<AxisDomain>;
  left?: number;
}

const AxisLeft = ({ scale, left }: Props) => {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const axis = select(ref.current) as Selection<
      SVGGElement,
      unknown,
      null,
      undefined
    >;
    axis.attr("transform", `translate(${left ?? 0}, 0)`).call(axisLeft(scale));
  }, [left, scale]);

  return <g ref={ref} className="y-axis" />;
};

export default AxisLeft;
