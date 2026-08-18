import * as React from 'react';
import { useEffect, useState } from 'react';
import { IconButton, Spinner, SpinnerSize, MessageBar, MessageBarType } from '@fluentui/react';
import { SPHttpClient } from '@microsoft/sp-http';

import styles from './ChartStudio.module.scss';
import { IChartTile, IListItemRecord } from './ChartStudioTypes';
import { fetchAllListItems } from './ChartStudioDataService';
import ChartRenderer from './ChartRenderer';

export interface IChartTileProps {
  tile: IChartTile;
  isEditMode: boolean;
  siteUrl: string;
  spHttpClient: SPHttpClient;
  onEdit: () => void;
  onDelete: () => void;
}

const ChartTile: React.FC<IChartTileProps> = ({ tile, isEditMode, siteUrl, spHttpClient, onEdit, onDelete }) => {
  const [items, setItems] = useState<IListItemRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      if (!tile.listName) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const fields =
          tile.chartType === 'scatter'
            ? [tile.xField, tile.yField, tile.seriesField]
            : tile.chartType === 'gauge'
            ? [tile.valueField]
            : [tile.categoryField, tile.valueField, tile.seriesField];
        const data = await fetchAllListItems(spHttpClient, siteUrl, tile.listName, fields);
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load chart data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load().catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile.listName, tile.chartType, tile.categoryField, tile.valueField, tile.seriesField, tile.xField, tile.yField]);

  const isConfigured =
    tile.listName &&
    (tile.chartType === 'gauge'
      ? tile.valueField
      : tile.chartType === 'scatter'
      ? tile.xField && tile.yField
      : tile.categoryField && tile.valueField);

  return (
    <div className={`${styles.tile} ${tile.width === 'full' ? styles.tileFull : styles.tileHalf}`}>
      <div className={styles.tileHeader}>
        <span className={styles.tileTitle}>{tile.title}</span>
        {isEditMode && (
          <div className={styles.tileControls}>
            <IconButton iconProps={{ iconName: 'Edit' }} title="Edit chart" ariaLabel="Edit chart" onClick={onEdit} />
            <IconButton iconProps={{ iconName: 'Delete' }} title="Remove chart" ariaLabel="Remove chart" onClick={onDelete} />
          </div>
        )}
      </div>

      <div className={styles.tileBody}>
        {!isConfigured ? (
          <div className={styles.tilePlaceholder}>
            {isEditMode ? 'Not configured yet — click Edit to set it up.' : 'This chart is not configured.'}
          </div>
        ) : loading ? (
          <Spinner size={SpinnerSize.medium} label="Loading…" />
        ) : error ? (
          <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>
        ) : items.length === 0 ? (
          <div className={styles.tilePlaceholder}>No data found.</div>
        ) : (
          <div className={styles.chartCanvas}>
            <ChartRenderer tile={tile} items={items} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartTile;
