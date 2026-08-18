import * as React from 'react';
import { useMemo } from 'react';
import { Bar, Line, Pie, Doughnut, Radar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

import { IChartTile, IListItemRecord, COLOR_THEMES } from './ChartStudioTypes';
import GaugeChart from './GaugeChart';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, RadialLinearScale, Filler, Tooltip, Legend
);

export interface IChartRendererProps {
  tile: IChartTile;
  items: IListItemRecord[];
}

function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

const ChartRenderer: React.FC<IChartRendererProps> = ({ tile, items }) => {
  const palette = COLOR_THEMES[tile.colorTheme] || COLOR_THEMES.vivid;

  // ---- Gauge: single aggregated value ----
  if (tile.chartType === 'gauge') {
    const total = items.reduce((sum, item) => sum + toNumber(item[tile.valueField]), 0);
    return <GaugeChart value={total} min={tile.minValue} max={tile.maxValue} target={tile.targetValue} color={palette[0]} />;
  }

  // ---- Scatter: raw x/y points, optionally split by series ----
  if (tile.chartType === 'scatter') {
    const seriesKeys = tile.seriesField
      ? Array.from(new Set(items.map((i) => String(i[tile.seriesField] ?? 'Other'))))
      : ['Values'];

    const datasets = seriesKeys.map((key, idx) => ({
      label: key,
      data: items
        .filter((i) => (tile.seriesField ? String(i[tile.seriesField] ?? 'Other') === key : true))
        .map((i) => ({ x: toNumber(i[tile.xField]), y: toNumber(i[tile.yField]) })),
      backgroundColor: palette[idx % palette.length]
    }));

    return <Scatter data={{ datasets }} options={{ responsive: true, maintainAspectRatio: false }} />;
  }

  // ---- Category/value charts: aggregate by category, optionally split by series ----
  const grouped = useMemo(() => {
    const categories = Array.from(
      new Set(items.map((i) => String(i[tile.categoryField] ?? 'Uncategorized')))
    );
    const seriesKeys = tile.seriesField
      ? Array.from(new Set(items.map((i) => String(i[tile.seriesField] ?? 'Other'))))
      : ['Value'];

    const sums = new Map<string, Map<string, number>>();
    seriesKeys.forEach((s) => sums.set(s, new Map()));

    items.forEach((item) => {
      const cat = String(item[tile.categoryField] ?? 'Uncategorized');
      const series = tile.seriesField ? String(item[tile.seriesField] ?? 'Other') : 'Value';
      const val = toNumber(item[tile.valueField]);
      const map = sums.get(series);
      if (map) {
        map.set(cat, (map.get(cat) || 0) + val);
      }
    });

    return { categories, seriesKeys, sums };
  }, [items, tile.categoryField, tile.valueField, tile.seriesField]);

  const { categories, seriesKeys, sums } = grouped;

  const isSingleSeriesPie = tile.chartType === 'pie' || tile.chartType === 'doughnut';

  const chartData = isSingleSeriesPie
    ? {
        labels: categories,
        datasets: [
          {
            data: categories.map((c) => sums.get(seriesKeys[0])?.get(c) || 0),
            backgroundColor: categories.map((_, i) => palette[i % palette.length]),
            borderColor: '#ffffff',
            borderWidth: 1
          }
        ]
      }
    : {
        labels: categories,
        datasets: seriesKeys.map((s, i) => ({
          label: s,
          data: categories.map((c) => sums.get(s)?.get(c) || 0),
          backgroundColor:
            tile.chartType === 'area'
              ? palette[i % palette.length] + '55'
              : palette[i % palette.length],
          borderColor: palette[i % palette.length],
          borderWidth: tile.chartType === 'line' || tile.chartType === 'area' ? 2 : 1,
          fill: tile.chartType === 'area',
          tension: 0.35
        }))
      };

  const stacked = tile.chartType === 'stackedBar';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: seriesKeys.length > 1 || isSingleSeriesPie }
    },
    scales:
      tile.chartType === 'radar' || isSingleSeriesPie
        ? undefined
        : {
            x: { stacked },
            y: { stacked }
          }
  };

  switch (tile.chartType) {
    case 'line':
    case 'area':
      return <Line data={chartData} options={options} />;
    case 'pie':
      return <Pie data={chartData} options={options} />;
    case 'doughnut':
      return <Doughnut data={chartData} options={options} />;
    case 'radar':
      return <Radar data={chartData} options={options} />;
    case 'bar':
    case 'groupedBar':
    case 'stackedBar':
    default:
      return <Bar data={chartData} options={options} />;
  }
};

export default ChartRenderer;
