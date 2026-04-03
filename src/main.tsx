import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import LineChart from './components/chart/LineChart';

const sampleData = [
  { x: 'Mon', y: 12 },
  { x: 'Tue', y: 18 },
  { x: 'Wed', y: 14 },
  { x: 'Thu', y: 21 },
  { x: 'Fri', y: 17 },
];

export const App = () => {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        background: 'linear-gradient(180deg, #f7fafc 0%, #edf2f7 100%)',
        color: '#1a202c',
        fontFamily:
          '"SUIT Variable", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#4a5568',
          }}
        >
          sowoon-chart
        </p>
        <h1
          style={{
            margin: '12px 0 8px',
            fontSize: '36px',
            lineHeight: 1.1,
          }}
        >
          Local build preview for the chart library
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: '680px',
            fontSize: '16px',
            lineHeight: 1.6,
            color: '#4a5568',
          }}
        >
          `npm run build` and `npm run dev` now have a small preview entry so we can sanity-check the
          package outside Storybook too.
        </p>

        <section
          style={{
            marginTop: '32px',
            padding: '24px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.88)',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              height: '320px',
            }}
          >
            <LineChart
              data={sampleData}
              color="#0f766e"
              height={320}
              tooltipPosition="point"
              showGridHorizontal={true}
              showGridVertical={true}
            >
              {({ tooltipData }) => (
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '12px',
                    background: '#111827',
                    color: '#f9fafb',
                    fontSize: '13px',
                    boxShadow: '0 8px 24px rgba(17, 24, 39, 0.24)',
                  }}
                >
                  {tooltipData.x}: {tooltipData.y}
                </div>
              )}
            </LineChart>
          </div>
        </section>
      </div>
    </main>
  );
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
