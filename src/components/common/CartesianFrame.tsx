import type { AxisDomain, AxisScale } from 'd3';
import type { CSSProperties, PointerEventHandler, ReactNode, RefObject } from 'react';

import AxisBottom from './AxisBottom';
import AxisLeft from './AxisLeft';
import GridHorizontal from './GridHorizontal';
import GridVertical from './GridVertical';

type Margin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  svgRef: RefObject<SVGSVGElement | null>;
  width?: number;
  height?: number;
  parentWidth: number;
  parentHeight: number;
  margin: Margin;
  xScale: AxisScale<AxisDomain>;
  yScale: AxisScale<AxisDomain>;
  showGridVertical?: boolean;
  showGridHorizontal?: boolean;
  onPointerMove?: PointerEventHandler<SVGSVGElement>;
  onPointerLeave?: PointerEventHandler<SVGSVGElement>;
  chart: ReactNode;
  defs?: ReactNode;
  tooltip?: ReactNode;
  overlay?: ReactNode;
  containerStyle?: CSSProperties;
};

const CartesianFrame = ({
  containerRef,
  svgRef,
  width,
  height,
  parentWidth,
  parentHeight,
  margin,
  xScale,
  yScale,
  showGridVertical = true,
  showGridHorizontal = true,
  onPointerMove,
  onPointerLeave,
  chart,
  defs,
  tooltip,
  overlay,
  containerStyle,
}: Props) => {
  return (
    <div
      ref={containerRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        position: 'relative',
        ...containerStyle,
      }}
    >
      <svg
        width={'100%'}
        height={'100%'}
        ref={svgRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {showGridVertical && (
          <GridVertical
            scale={xScale}
            size={parentHeight - margin.bottom - margin.top}
            top={parentHeight - margin.bottom}
          />
        )}
        {showGridHorizontal && (
          <GridHorizontal
            scale={yScale}
            size={parentWidth - margin.left - margin.right}
            left={margin.left}
          />
        )}
        <AxisBottom scale={xScale} top={parentHeight - margin.bottom} />
        <AxisLeft scale={yScale} left={margin.left} />
        {chart}
        {defs}
      </svg>
      {tooltip}
      {overlay}
    </div>
  );
};

export default CartesianFrame;
