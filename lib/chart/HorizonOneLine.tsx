import React from 'react';
import type { ComponentType } from 'react';
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
}) => (
  <div
    style={{
      width: width!,
      height: height!,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}
  >
    <div
      style={{
        width: '100%',
        display: 'flex',
        height: '50px',
        position: 'relative',
      }}
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
        <span>{data.length > 2 ? '전혀 그렇지 않다.' : '비동의'}</span>
        <span>{data.length > 2 ? '매우 그렇다.' : '동의'}</span>
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
    </div>
  </div>
);

export default withParentSize(HorizonOneLine);
