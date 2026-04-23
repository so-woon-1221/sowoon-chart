# Sowoon Chart

`Sowoon Chart`는 React와 D3 기반으로 만든 차트 라이브러리입니다.

라인, 바, 영역, 그룹형, 스택형, 산점도, 파이, 레이더, 버블, 네트워크, 워드클라우드까지 한 프로젝트 안에서 일관된 방식으로 사용할 수 있도록 구성되어 있습니다.

## 특징

- React 컴포넌트 형태로 차트를 바로 렌더링할 수 있습니다.
- 내부 렌더링은 D3를 사용해 축, 스케일, 인터랙션을 구성합니다.
- tooltip render prop 패턴을 사용해 원하는 UI로 툴팁을 커스터마이즈할 수 있습니다.
- tooltip 기준 위치를 `auto`, `cursor`, `point`로 선택할 수 있습니다.
- `ResizeObserver` 기반으로 부모 컨테이너 크기 변화를 따라갑니다.
- `ExportImage` 컴포넌트로 차트 영역을 이미지로 저장할 수 있습니다.

## 설치

```bash
npm install sowoon-chart
```

이 라이브러리는 아래 패키지를 함께 사용합니다.

- `react`
- `react-dom`
- `d3`

프로젝트 환경에 따라 아래처럼 함께 설치하시면 됩니다.

```bash
npm install sowoon-chart react react-dom d3
```

## 빠른 시작

가장 기본적인 사용 예시는 아래와 같습니다.

```tsx
import { LineChart } from 'sowoon-chart';

const data = [
  { x: 'A', y: 10 },
  { x: 'B', y: 20 },
  { x: 'C', y: 15 },
  { x: 'D', y: 30 },
];

export default function Example() {
  return (
    <div style={{ width: 720, height: 360 }}>
      <LineChart data={data} height={360} color="#111827" tooltipPosition="cursor">
        {({ tooltipData }) => (
          <div
            style={{
              background: '#111827',
              color: '#fff',
              padding: '6px 8px',
              borderRadius: 8,
            }}
          >
            {tooltipData.x}: {tooltipData.y}
          </div>
        )}
      </LineChart>
    </div>
  );
}
```

## 제공 컴포넌트

### 기본 Cartesian 차트

- `LineChart`
- `BarChart`
- `AreaChart`
- `ScatterChart`

### 다중 시리즈 차트

- `GroupBarChart`
- `GroupLineChart`
- `StackBarChart`
- `StackLineChart`

### 특수 차트

- `PieChart`
- `RadarChart`
- `BubbleChart`
- `NetworkChart`
- `Wordcloud`

### 유틸리티

- `ExportImage`

## 공통 props

단일 시리즈 Cartesian 차트들은 아래 props를 공통으로 사용합니다.

- `data`: `Array<{ x: string; y: number }>`
- `width?`: 차트 너비
- `height?`: 차트 높이
- `margin?`: `{ top, right, bottom, left }`
- `color?`: 메인 컬러
- `minY?`: y축 최소값
- `maxY?`: y축 최대값
- `showGridVertical?`: 세로 grid 표시 여부
- `showGridHorizontal?`: 가로 grid 표시 여부

예시:

```tsx
<BarChart
  data={[
    { x: 'A', y: 10 },
    { x: 'B', y: 24 },
    { x: 'C', y: 18 },
  ]}
  height={320}
  color="#0f766e"
  minY={0}
  maxY={30}
/>
```

## 차트별 props 차이

차트마다 자주 다르게 쓰는 옵션은 아래 정도로 보시면 됩니다.

- `LineChart`, `AreaChart`, `GroupLineChart`, `StackLineChart`
  - `showActiveMarker?`
  - `showCrosshair?`
  - `tooltipPosition?: 'auto' | 'cursor' | 'point'`
- `BarChart`, `GroupBarChart`, `StackBarChart`
  - `padding?`
  - `tooltipPosition?: 'auto' | 'cursor' | 'point'`
- `ScatterChart`
  - `minSize?`
  - `maxSize?`
  - `tooltipPosition?: 'auto' | 'cursor' | 'point'`
- `PieChart`
  - `centerNode?`
  - `colorList?`
  - `showLegend?`
  - `tooltipPosition?: 'auto' | 'cursor' | 'point'`
- `RadarChart`
  - `colorList`
  - `margin?: number`
  - `tooltipPosition?: 'auto' | 'cursor' | 'point'`
- `NetworkChart`, `BubbleChart`, `Wordcloud`
  - 좌표축 기반 차트가 아니라서 props 구조가 따로 분리되어 있습니다.

## 툴팁 사용 방식

tooltip은 `children` render prop으로 전달합니다.

```tsx
<AreaChart data={data} height={320}>
  {({ tooltipData }) => (
    <div>
      {tooltipData.x}: {tooltipData.y}
    </div>
  )}
</AreaChart>
```

`tooltipPosition` 옵션을 지원하는 차트에서는 툴팁 기준 위치를 선택할 수 있습니다.

- `auto`: 기본 모드입니다. 마우스에서는 `cursor`, touch/pen에서는 `point`로 동작합니다.
- `cursor`: 마우스 포인터를 따라갑니다.
- `point`: 가장 가까운 데이터 포인트나 활성 마크에 붙습니다.

현재 지원 차트:

- `LineChart`
- `BarChart`
- `AreaChart`
- `GroupBarChart`
- `GroupLineChart`
- `StackBarChart`
- `StackLineChart`
- `ScatterChart`
- `PieChart`
- `RadarChart`

예시:

```tsx
<LineChart data={data} height={320} tooltipPosition="auto" showActiveMarker showCrosshair>
  {({ tooltipData }) => (
    <div>
      {tooltipData.x}: {tooltipData.y}
    </div>
  )}
</LineChart>
```

`PieChart`, `RadarChart`도 같은 방식으로 tooltip을 받을 수 있습니다. `PieChart`는 `showLegend`를 켜면 범례 hover와 slice 강조가 함께 동작합니다.

```tsx
<PieChart data={data} height={320} showLegend tooltipPosition="auto">
  {({ tooltipData }) => (
    <div>
      {tooltipData.x}: {tooltipData.y}
    </div>
  )}
</PieChart>
```

## 접근성

차트 SVG에는 기본 accessible name이 들어가며, 필요하면 `ariaLabel`과 `ariaDescription`으로 더 구체적인 설명을 전달할 수 있습니다.

```tsx
<LineChart
  data={data}
  height={320}
  ariaLabel="월별 매출 라인 차트"
  ariaDescription="A, B, C 월의 매출 추이를 비교합니다."
/>
```

타입도 패키지 루트에서 바로 가져올 수 있습니다.

```tsx
import type { LineChartProps, TooltipPositionMode, TooltipRenderer, XYDatum } from 'sowoon-chart';
```

## 차트별 데이터 형태

### 단일 시리즈

`LineChart`, `BarChart`, `AreaChart`, `PieChart` 등은 보통 아래 형태를 사용합니다.

```ts
[
  { x: 'A', y: 10 },
  { x: 'B', y: 20 },
  { x: 'C', y: 30 },
];
```

### 그룹형 / 스택형

`GroupBarChart`, `GroupLineChart`, `StackBarChart`, `StackLineChart`는 `x` 외에 여러 수치 키를 함께 받습니다.

```ts
[
  { x: 'A', sales: 10, profit: 4, cost: 6 },
  { x: 'B', sales: 20, profit: 8, cost: 12 },
  { x: 'C', sales: 15, profit: 5, cost: 10 },
];
```

### 산점도

`ScatterChart`는 점 위치와 크기 정보를 함께 받습니다.

```ts
[
  { x: 'A', y: 10, value: 8 },
  { x: 'B', y: 20, value: 14 },
  { x: 'C', y: 16, value: 10 },
];
```

### 네트워크 차트

`NetworkChart`는 `nodes`, `links` 구조를 사용합니다.

```ts
{
  nodes: [
    { id: 'A', value: 10, group: 'team-1' },
    { id: 'B', value: 16, group: 'team-1' },
    { id: 'C', value: 24, group: 'team-2' }
  ],
  links: [
    { source: 'A', target: 'B', value: 10 },
    { source: 'B', target: 'C', value: 20 }
  ]
}
```

## ExportImage 사용 예시

`ExportImage`는 특정 DOM 또는 SVG 영역을 `png` 또는 `svg`로 저장할 때 사용합니다.

```tsx
import { useRef } from 'react';
import { BarChart, ExportImage } from 'sowoon-chart';

export default function ExportExample() {
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={ref}>
      <ExportImage
        ref={ref}
        fileName="sales-chart"
        fileFormat="png"
        ariaLabel="매출 차트 PNG 저장"
        loadingIcon="저장 중…"
        onError={(error) => {
          console.error(error);
        }}
      />
      <BarChart
        data={[
          { x: 'A', y: 10 },
          { x: 'B', y: 20 },
          { x: 'C', y: 15 },
        ]}
        height={320}
      />
    </div>
  );
}
```
