import { useParentSize } from '../../hooks/useParentSize.tsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { extent, scaleLinear, select } from 'd3'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import WordCloudWorker from 'web-worker:./lib/wordcloud.worker.js'
import { type ChartProps } from '../../util/types.ts'

type Props = Omit<ChartProps, 'maxY' | 'minY' | 'color'> & {
  colorList?: string[]
  padding?: number
}

const Wordcloud = ({
  width,
  height,
  data,
  padding = 1,
  colorList = ['#0A0908', '#0891b2', '#C6AC8F', '#60D394', '#D1495B', '#9b5de5']
}: Props) => {
  const {
    ref: parentRef,
    width: parentWidth,
    height: parentHeight
  } = useParentSize()

  const ref = useRef<SVGSVGElement>(null)

  const [words, setWords] = useState<
    | {
        text: string
        size: number
        x: number
        y: number
        rotate: number
      }[]
    | null
  >(null)

  const fontScale = useMemo(
    () =>
      scaleLinear()
        .domain(extent(data.map(d => +d.y)) as [number, number])
        .range([15, 80]),
    [data]
  )

  const colorMap = useMemo(() => {
    const map = new Map()
    data.forEach((d, i) => {
      map.set(d.x, colorList[i % colorList.length])
    })

    return map
  }, [colorList, data])

  const wordData = useMemo(
    () => data.map(d => ({ text: d.x, size: fontScale(d.y) })),
    [data, fontScale]
  )

  useEffect(() => {
    const worker: Worker = new WordCloudWorker()

    worker.postMessage({
      width: parentWidth,
      height: parentHeight,
      data: wordData,
      padding
    })

    worker.onmessage = e => {
      setWords(e.data.data)
    }

    return () => {
      worker.terminate()
    }
  }, [padding, parentHeight, parentWidth, wordData])

  const drawChart = useCallback(() => {
    const svg = select(ref.current)
    const chartContainer = svg.select('.word-container')

    if (words) {
      chartContainer.attr(
        'transform',
        `translate(${parentWidth! / 2}, ${parentHeight! / 2})`
      )
      const wordEl = chartContainer.selectAll('text').data(words)

      wordEl
        .join('text')
        .style('font-size', d => `${d.size}px`)
        .style('font-family', 'Impact')
        .attr('text-anchor', 'middle')
        .attr('cursor', 'pointer')
        .attr('transform', d => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
        .text(d => d.text as string)
        .attr('fill', d => colorMap.get(d.text))
        .on('mouseover', e => {
          chartContainer.selectAll('text').attr('opacity', 0.5)
          select(e.target).attr('opacity', 1)
        })
        .on('mouseout', () => {
          chartContainer.selectAll('text').attr('opacity', 1)
        })
    }
  }, [colorMap, parentHeight, parentWidth, words])

  useEffect(() => {
    drawChart()
  }, [drawChart])

  return (
    <div
      ref={parentRef}
      style={{
        width: width ?? '100%',
        height: height ?? '100%'
      }}
    >
      <svg width={'100%'} height={'100%'} ref={ref}>
        <g className={'word-container'} />
      </svg>
    </div>
  )
}

export default Wordcloud
