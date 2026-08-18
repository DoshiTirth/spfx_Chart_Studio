import * as React from 'react';
import { useState } from 'react';
import { CommandBarButton, MessageBar, MessageBarType } from '@fluentui/react';

import styles from './ChartStudio.module.scss';
import { IChartStudioProps } from './IChartStudioProps';
import { IChartTile, createDefaultTile } from './ChartStudioTypes';
import ChartTile from './ChartTile';
import TileConfigPanel from './TileConfigPanel';

const ChartStudio: React.FC<IChartStudioProps> = (props) => {
  const { studioTitle, tiles, onTilesChange, isEditMode } = props;

  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [editingTile, setEditingTile] = useState<IChartTile | null>(null);

  const openAddPanel = (): void => {
    setEditingTile(createDefaultTile());
    setPanelOpen(true);
  };

  const openEditPanel = (tile: IChartTile): void => {
    setEditingTile(tile);
    setPanelOpen(true);
  };

  const handleSave = (updated: IChartTile): void => {
    const exists = tiles.some((t) => t.id === updated.id);
    const next = exists ? tiles.map((t) => (t.id === updated.id ? updated : t)) : [...tiles, updated];
    onTilesChange(next);
    setPanelOpen(false);
    setEditingTile(null);
  };

  const handleDelete = (id: string): void => {
    onTilesChange(tiles.filter((t) => t.id !== id));
  };

  return (
    <div className={styles.chartStudio}>
      <div className={styles.header}>
        <h2 className={styles.title}>{studioTitle || 'Chart Studio'}</h2>
        {isEditMode && (
          <CommandBarButton
            iconProps={{ iconName: 'Add' }}
            text="Add chart"
            onClick={openAddPanel}
            className={styles.addButton}
          />
        )}
      </div>

      {tiles.length === 0 ? (
        <MessageBar messageBarType={MessageBarType.info}>
          {isEditMode
            ? 'No charts yet — click "Add chart" to build your first one.'
            : 'No charts have been configured for this dashboard yet.'}
        </MessageBar>
      ) : (
        <div className={styles.canvas}>
          {tiles.map((tile) => (
            <ChartTile
              key={tile.id}
              tile={tile}
              isEditMode={isEditMode}
              siteUrl={props.siteUrl}
              spHttpClient={props.spHttpClient}
              onEdit={() => openEditPanel(tile)}
              onDelete={() => handleDelete(tile.id)}
            />
          ))}
        </div>
      )}

      {editingTile && (
        <TileConfigPanel
          isOpen={panelOpen}
          tile={editingTile}
          onDismiss={() => {
            setPanelOpen(false);
            setEditingTile(null);
          }}
          onSave={handleSave}
          siteUrl={props.siteUrl}
          spHttpClient={props.spHttpClient}
        />
      )}
    </div>
  );
};

export default ChartStudio;
