import React from 'react';
import { ParentSize } from '@visx/responsive';
import type { ComponentType } from 'react';

const withParentSize = <
  P extends {
    data: any;
    id: string;
    height?: number;
  },
>(
  ChartComponent: ComponentType<P>,
): ComponentType<
  {
    data: any;
    id: string;
    height?: number;
  } & Omit<
    P,
    keyof {
      width: number;
      height: number;
    }
  >
> => {
  const Component = (props: any) => (
    <ParentSize>
      {({ width: parentWidth, height: parentHeight }) => {
        const combinedProps = {
          ...props,
          width: parentWidth,
          height: props?.height ?? parentHeight,
        };
        return <ChartComponent {...(combinedProps as unknown as P)} />;
      }}
    </ParentSize>
  );
  return Component;
};
export default withParentSize;
