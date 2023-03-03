import React, { useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import withParentSize from '../hooks/withParentSize';
import { ChartProps } from '../util';
import BrushLineChart from './BrushLineChart';
import LineChart from './LineChart';

const LineWithBrushChart: ComponentType<ChartProps> = ({
  data,
  id,
  colorList,
  groupType,
  tooltipMaker,
  legendLabelList,
  displayIndex,
  height,
}) => {
  const [brushDomain, setBrushDomain] = useState<string[] | undefined>(
    undefined,
  );

  const brushApplyData = useMemo(() => {
    if (brushDomain && brushDomain.filter(d => d !== undefined).length > 0) {
      return data.filter(d => brushDomain.includes(d.x));
    }
    return data;
  }, [brushDomain, data]);

  return (
    <div className="flex h-full w-full flex-col">
      <LineChart
        data={brushApplyData}
        groupType={groupType}
        id={`${id}-line`}
        tooltipMaker={tooltipMaker}
        legendLabelList={legendLabelList}
        colorList={colorList}
        displayIndex={displayIndex}
        height={height! - 50}
      />
      <div className="h-[50px]">
        <BrushLineChart
          data={data}
          id={`${id}-brush`}
          groupType={groupType}
          colorList={colorList}
          setBrushDomain={setBrushDomain}
        />
      </div>
    </div>
  );
};

export default withParentSize(LineWithBrushChart);
