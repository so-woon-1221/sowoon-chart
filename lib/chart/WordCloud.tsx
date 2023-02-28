import React from "react";
import withParentSize from "../hooks/withParentSize";
import { useMemo } from "react";
import { extent, scaleLog } from "d3";
import type { ComponentType } from "react";
import { Wordcloud } from "@visx/wordcloud";

interface Props {
  /**
   * Data for the chart.
   * Each element of the array should have the following format:
   * {
   *  text: string;
   *  value: number;
   * }
   */
  data: {
    text: string;
    value: number;
  }[];
  /**
   * ID of the chart
   * */
  id: string;
  width?: number;
  height?: number;
  /**
   * Color list for the chart
   * - five colors are used by default
   * - rotate when the number of data points exceeds the number of colors
   * @default ["#0A0908", "#0891b2", "#C6AC8F", "#60D394", "#D1495B", "#9b5de5"]
   */
  colorList?: string[];
  /**
   * Type of the spiral
   * - "rectangular" or "archimedean"
   * @default "rectangular"
   * */
  type?: "rectangular" | "archimedean";
}

const WordCloud: ComponentType<Props> = ({
  data,
  width,
  height,
  id,
  colorList = [
    "#0A0908",
    "#0891b2",
    "#C6AC8F",
    "#60D394",
    "#D1495B",
    "#9b5de5",
  ],
  type = "rectangular",
}) => {
  const fontScale = useMemo(() => {
    return scaleLog()
      .domain(extent(data.map((d) => +d.value)) as any)
      .range([15, 80]);
  }, [data]);

  const colorMap = useMemo(() => {
    const map = new Map();
    data.forEach((d, i) => {
      map.set(d.text, colorList[i % colorList.length]);
    });

    return map;
  }, [colorList, data]);

  // const drawChart = useCallback(() => {
  //   const cloud2 = cloud()
  //     .size([width!, height!])
  //     .words(
  //       data.map((d) => {
  //         return { text: d.text, size: d.value };
  //       }),
  //     )
  //     // .padding(4)
  //     .rotate(0)
  //     // .spiral('rectangular')
  //     .random(() => 0.5)
  //     .font('Impact')
  //     .fontSize((d) => fontScale(d.size!) as any)
  //     .on('end', draw);
  //
  //   cloud2.start();
  //
  //   function draw(words: any) {
  //     select(`#${id}-svg`)
  //       .attr(
  //         'transform',
  //         `translate(${cloud2.size()[0] / 2},${cloud2.size()[1] / 2})`,
  //       )
  //       .selectAll('text')
  //       .data(words)
  //       .join('text')
  //       .style('font-size', function (d: any) {
  //         return d.size + 'px';
  //       })
  //       .style('font-weight', 600)
  //       .style('font-family', 'Impact')
  //       .attr('text-anchor', 'middle')
  //       .attr('transform', function (d: any) {
  //         return `translate(${d.x}, ${d.y}) rotate(${d.rotate})`;
  //       })
  //       .style('fill', (d: any) => {
  //         return colorMap.get(d.text);
  //       })
  //       .on('mouseover', function (e, d: any) {
  //         const texts = (
  //           select(select(e.target).node().parentNode).selectAll('text') as any
  //         )._groups[0];
  //         for (let text of texts) {
  //           if (select(text).text() !== d.text) {
  //             select(text).transition().attr('opacity', 0.1);
  //           } else {
  //             select(text).attr('opacity', 1);
  //           }
  //         }
  //       })
  //       .on('mouseleave', function (e, d: any) {
  //         select(select(e.target).node().parentNode)
  //           .selectAll('text')
  //           .transition()
  //           .attr('opacity', 1);
  //       })
  //       .text(function (d: any) {
  //         return d.text;
  //       });
  //   }
  //
  //   return null;
  // }, [colorMap, data, fontScale, height, id, setSelectedText, width]);

  // useEffect(() => {
  //   drawChart();
  // }, [drawChart]);

  return (
    <div className="h-full w-full select-text">
      <svg width={width} height={height}>
        {/*<g id={`${id}-svg`} />*/}
        <Wordcloud
          words={data}
          height={height!}
          width={width!}
          font={"Impact"}
          fontSize={(datum) => fontScale(datum.value)}
          random={() => 0.5}
          // padding={2}
          spiral={"archimedean"}
          rotate={0}
        >
          {(cloudWords) =>
            cloudWords.map((w) => {
              return (
                <text
                  key={w.text}
                  style={{ fontSize: w.size }}
                  transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                  textAnchor={"middle"}
                  fill={colorMap.get(w.text)}
                >
                  {w.text}
                </text>
                // <Text
                //   key={w.text}
                //   fill={'black'}
                //   textAnchor={'middle'}
                //   transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                //   fontSize={w.size}
                //   fontFamily={w.font}
                // >
                //   {w.text}
                // </Text>
              );
            })
          }
        </Wordcloud>
      </svg>
    </div>
  );
};

export default withParentSize(WordCloud);
