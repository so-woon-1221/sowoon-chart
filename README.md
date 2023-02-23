# sowoon-chart

This is a React chart library that allows users to easily create customizable and interactive charts for their web applications.

## Features
- Multiple Chart Types: This library supports a variety of chart types including line, bar, pie, doughnut, and more.
- Customizable Styles: Users can customize the styles of their charts including colors, font size, and font family.
- Interactive: The charts are interactive and allow users to hover over data points to view more information.
- Responsive: The library is designed to be responsive and works on all screen sizes.
- Easy to Use: This library is designed to be easy to use for developers of all skill levels.

## Getting Started
To use this library, follow these steps:

1. Install the library using npm:
```css
npm install react-chart-library --save
```

2. Import the chart you want to use from the library:
```tsx
import { LineChart } from 'react-chart-library';
```

3. Use the chart component in your application:
```tsx
<LineChart data={data} options={options} />
```

## Example
Here's an example of how to use the library to create a line chart:

```tsx
import React from 'react';
import { LineChart } from 'react-chart-library';

const data = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'Sales',
      data: [12, 19, 3, 5, 2, 3, 7],
      fill: false,
      borderColor: '#4caf50',
    },
  ],
};

const options = {
  title: {
    display: true,
    text: 'Sales Data',
  },
};

const App = () => {
  return <LineChart data={data} options={options} />;
};

export default App;
```

## Contributing
Contributions are welcome! If you find any bugs or want to contribute to the library, please create an issue or submit a pull request on the Github repository.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
