import { pointer } from 'd3-selection';
import React, { MouseEventHandler, useState } from 'react';
import type { ComponentType } from 'react';
import { useTooltipInPortal } from '@visx/tooltip';

import withParentSize from '../hooks/withParentSize';

interface Props {
  /**
   * data
   * - key :
   *   - key of the data
   *   - type: string
   * - value :
   *  - value of the data
   *  - type: number
   */
  data: Array<{ key: string; value: number; description?: string }>;
  /**
   * List of colors for the graph
   * - Colors are applied in the order of the keyList
   * - If the length of colorList is shorter than that of keyList, the last color in colorList is repeated.
   * - If the length of colorList is longer than that of keyList, the excess part of colorList is ignored.
   */
  colorList: Array<string>;
  width?: number;
  height?: number;
  /**
   * id
   * - id of svg
   */
  id: string;
}

const HorizonOneLine: ComponentType<Props> = ({
  data,
  colorList,
  width,
  height,
  id,
}) => {
  const [tooltip, setTooltip] = useState<
    undefined | { x: number; y: number; data?: number }
  >(undefined);
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  const onHover: MouseEventHandler = e => {
    const x = pointer(e)[0];
    const y = pointer(e)[1];

    setTooltip(prev => ({ x, y, data: prev?.data }));
  };

  const onMouseLeave = () => {
    setTooltip(undefined);
  };

  return (
    <div
      style={{
        width: width!,
        height: height!,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
      id={id}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          height: '50px',
          position: 'relative',
        }}
        ref={containerRef}
        onMouseMove={onHover}
        onMouseLeave={onMouseLeave}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'translate(0, -100%)',
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <span>전혀 그렇지 않다.</span>
          <span>매우 그렇다.</span>
        </div>
        {data.map((d, i) => (
          <div
            key={`${d.key}`}
            style={{
              width: `${d.value}%`,
              height: '100%',
              backgroundColor: colorList[i],
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}
            onMouseMove={() => {
              setTooltip(prev => ({
                x: prev?.x ?? 0,
                y: prev?.y ?? 0,
                data: d.value,
              }));
            }}
          >
            {(i === 0 || i === data.length - 1) && (
              <span
                style={{
                  borderLeft: '1px solid black',
                  padding: '0 5px',
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  transform: 'translate(0%, 0)',
                }}
              >
                {d.value.toLocaleString('ko-KR', {
                  maximumFractionDigits: 0,
                })}
                %
              </span>
            )}
          </div>
        ))}
        {tooltip && (
          <TooltipInPortal left={tooltip.x} top={tooltip.y} detectBounds>
            {tooltip.data?.toLocaleString('ko-KR', {
              maximumFractionDigits: 1,
            })}
            %
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

export default withParentSize(HorizonOneLine);
