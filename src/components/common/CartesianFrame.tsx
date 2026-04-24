import type { AxisDomain, AxisScale } from 'd3';
import type { CSSProperties, PointerEventHandler, ReactNode, RefObject } from 'react';

import type { AxisOptionProps, Margin } from '../../util/types';
import AxisBottom from './AxisBottom';
import AxisLeft from './AxisLeft';
import GridHorizontal from './GridHorizontal';
import GridVertical from './GridVertical';

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
  xTickCount?: AxisOptionProps['xTickCount'];
  yTickCount?: AxisOptionProps['yTickCount'];
  xTickFormat?: AxisOptionProps['xTickFormat'];
  yTickFormat?: AxisOptionProps['yTickFormat'];
  xTickAngle?: AxisOptionProps['xTickAngle'];
  xAxisLabel?: AxisOptionProps['xAxisLabel'];
  yAxisLabel?: AxisOptionProps['yAxisLabel'];
  onPointerMove?: PointerEventHandler<SVGSVGElement>;
  onPointerLeave?: PointerEventHandler<SVGSVGElement>;
  onPointerUp?: PointerEventHandler<SVGSVGElement>;
  onPointerCancel?: PointerEventHandler<SVGSVGElement>;
  ariaLabel?: string;
  ariaDescription?: string;
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
  xTickCount,
  yTickCount,
  xTickFormat,
  yTickFormat,
  xTickAngle,
  xAxisLabel,
  yAxisLabel,
  onPointerMove,
  onPointerLeave,
  onPointerUp,
  onPointerCancel,
  ariaLabel = 'Chart',
  ariaDescription,
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
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <title>{ariaLabel}</title>
        {ariaDescription && <desc>{ariaDescription}</desc>}
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
        <AxisBottom
          scale={xScale}
          top={parentHeight - margin.bottom}
          tickCount={xTickCount}
          tickFormat={xTickFormat}
          tickAngle={xTickAngle}
          label={xAxisLabel}
        />
        <AxisLeft
          scale={yScale}
          left={margin.left}
          tickCount={yTickCount}
          tickFormat={yTickFormat}
          label={yAxisLabel}
        />
        {chart}
        {defs}
      </svg>
      {tooltip}
      {overlay}
    </div>
  );
};

export default CartesianFrame;
