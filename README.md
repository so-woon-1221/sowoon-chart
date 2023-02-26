# sowoon-chart

This is a React chart library that allows users to easily create customizable and interactive charts for their web applications.

## Features
- Multiple Chart Types: This library supports a variety of chart types including line, bar, pie, doughnut, and more.
- Customizable Styles: Users can customize the styles of their charts including colors, font size, and font family.
- Interactive: The charts are interactive and allow users to hover over data points to view more information.
- Easy to Use: This library is designed to be easy to use for developers of all skill levels.

## Getting Started
To use this library, follow these steps:

1. Install the library using npm:
```bash
npm install sowoon-chart --save
```

2. Import the chart you want to use from the library:
```tsx
import { LineChart } from 'sowoon-chart';
import 'sowoon-chart/dist/index.css';
```

3. Use the chart component in your application:
```tsx
<LineChart
  data={[
    { x: "2020-01-01", y: 10 },
    { x: "2020-01-02", y: 20 },
    { x: "2020-01-03", y: 30 },
  ]}
  id="chart"
  height={500}
  groupType="none"
  xType="band"
  colorList={["#000000"]}
/>
```

## Example
Here's an example of how to use the library to create a line chart:

```tsx
import React from 'react';
import { LineChart } from 'react-chart-library';

const App = () => {
  return <LineChart
    data={[
      { x: "2020-01-01", y: 10 },
      { x: "2020-01-02", y: 20 },
      { x: "2020-01-03", y: 30 },
    ]}
    id="chart"
    width={800}
    height={500}
    groupType="none"
    xType="band"
    colorList={["#000000"]}
  />;
};

export default App;
```

## Contributing
Contributions are welcome! If you find any bugs or want to contribute to the library, please create an issue or submit a pull request on the Github repository.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
