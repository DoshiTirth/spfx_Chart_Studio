export type ChartType =
  | 'bar'
  | 'groupedBar'
  | 'stackedBar'
  | 'line'
  | 'area'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'scatter'
  | 'gauge';

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  bar: 'Bar',
  groupedBar: 'Grouped bar',
  stackedBar: 'Stacked bar',
  line: 'Line',
  area: 'Area',
  pie: 'Pie',
  doughnut: 'Doughnut',
  radar: 'Radar',
  scatter: 'Scatter',
  gauge: 'Gauge'
};

/** Charts that plot category -> aggregated value, optionally split by a series field. */
export const CATEGORY_VALUE_CHARTS: ChartType[] = [
  'bar', 'groupedBar', 'stackedBar', 'line', 'area', 'pie', 'doughnut', 'radar'
];

export type ColorTheme = 'vivid' | 'cool' | 'warm' | 'mono';

export const COLOR_THEMES: Record<ColorTheme, string[]> = {
  vivid: ['#2f6fed', '#12b886', '#f59f00', '#e64980', '#7048e8', '#15aabf', '#fa5252'],
  cool: ['#2f6fed', '#15aabf', '#12b886', '#4263eb', '#22b8cf', '#0ca678', '#5c7cfa'],
  warm: ['#f59f00', '#e64980', '#fa5252', '#e8590c', '#f76707', '#d6336c', '#c2255c'],
  mono: ['#1b1b1f', '#4b4f57', '#6b6f76', '#8a8f98', '#aeb2ba', '#c7cbd4', '#dfe2e8']
};

export type TileWidth = 'half' | 'full';

export interface IChartTile {
  id: string;
  title: string;
  chartType: ChartType;
  width: TileWidth;
  colorTheme: ColorTheme;
  listName: string;
  categoryField: string;
  valueField: string;
  seriesField: string;   // optional grouping field, '' if unused
  xField: string;        // scatter only
  yField: string;        // scatter only
  minValue: number;      // gauge only
  maxValue: number;      // gauge only
  targetValue: number;   // gauge only
}

export function createDefaultTile(): IChartTile {
  return {
    id: `tile-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    title: 'New chart',
    chartType: 'bar',
    width: 'half',
    colorTheme: 'vivid',
    listName: '',
    categoryField: '',
    valueField: '',
    seriesField: '',
    xField: '',
    yField: '',
    minValue: 0,
    maxValue: 100,
    targetValue: 75
  };
}

export interface IListItemRecord {
  Id: number;
  [key: string]: unknown;
}
