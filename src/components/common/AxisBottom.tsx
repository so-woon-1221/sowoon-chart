import { useEffect, useRef } from "react";
import { axisBottom, AxisDomain, AxisScale, select, Selection } from "d3";

interface Props {
  scale: AxisScale<AxisDomain>;
  top?: number;
}

const AxisBottom = ({ scale, top }: Props) => {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const axis = select(ref.current) as Selection<
      SVGGElement,
      unknown,
      null,
      undefined
    >;
    axis.attr("transform", `translate(0, ${top ?? 0})`).call(axisBottom(scale));
  }, [scale, top]);

  return <g ref={ref} className="x-axis" />;
};

export default AxisBottom;
