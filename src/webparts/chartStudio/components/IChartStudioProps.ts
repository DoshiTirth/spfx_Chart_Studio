import { SPHttpClient } from '@microsoft/sp-http';
import { IChartTile } from './ChartStudioTypes';

export interface IChartStudioProps {
  studioTitle: string;
  tiles: IChartTile[];
  onTilesChange: (tiles: IChartTile[]) => void;
  isEditMode: boolean;
  siteUrl: string;
  spHttpClient: SPHttpClient;
}
