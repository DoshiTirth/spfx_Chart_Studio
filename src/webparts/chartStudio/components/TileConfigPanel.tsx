import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Panel,
  PanelType,
  PrimaryButton,
  DefaultButton,
  TextField,
  Dropdown,
  IDropdownOption,
  ChoiceGroup,
  IChoiceGroupOption,
  Label,
  Separator,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType
} from '@fluentui/react';
import { SPHttpClient } from '@microsoft/sp-http';

import styles from './ChartStudio.module.scss';
import {
  ChartType,
  CHART_TYPE_LABELS,
  CATEGORY_VALUE_CHARTS,
  ColorTheme,
  IChartTile
} from './ChartStudioTypes';
import { fetchListFields, IListField } from './ChartStudioDataService';

export interface ITileConfigPanelProps {
  isOpen: boolean;
  tile: IChartTile;
  onDismiss: () => void;
  onSave: (tile: IChartTile) => void;
  siteUrl: string;
  spHttpClient: SPHttpClient;
}

const chartTypeOptions: IDropdownOption[] = (Object.keys(CHART_TYPE_LABELS) as ChartType[]).map((k) => ({
  key: k,
  text: CHART_TYPE_LABELS[k]
}));

const themeOptions: IChoiceGroupOption[] = [
  { key: 'vivid', text: 'Vivid' },
  { key: 'cool', text: 'Cool' },
  { key: 'warm', text: 'Warm' },
  { key: 'mono', text: 'Mono' }
];

const widthOptions: IChoiceGroupOption[] = [
  { key: 'half', text: 'Half width' },
  { key: 'full', text: 'Full width' }
];

const TileConfigPanel: React.FC<ITileConfigPanelProps> = ({
  isOpen,
  tile,
  onDismiss,
  onSave,
  siteUrl,
  spHttpClient
}) => {
  const [draft, setDraft] = useState<IChartTile>(tile);
  const [fields, setFields] = useState<IListField[]>([]);
  const [loadingFields, setLoadingFields] = useState<boolean>(false);
  const [fieldsError, setFieldsError] = useState<string>('');

  useEffect(() => {
    setDraft(tile);
  }, [tile, isOpen]);

  useEffect(() => {
    if (!draft.listName) {
      setFields([]);
      return;
    }
    let cancelled = false;
    setLoadingFields(true);
    setFieldsError('');
    fetchListFields(spHttpClient, siteUrl, draft.listName)
      .then((f) => {
        if (!cancelled) setFields(f);
      })
      .catch((e) => {
        if (!cancelled) setFieldsError(e instanceof Error ? e.message : 'Could not load fields.');
      })
      .finally(() => {
        if (!cancelled) setLoadingFields(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.listName]);

  const fieldOptions: IDropdownOption[] = useMemo(
    () => fields.map((f) => ({ key: f.internalName, text: `${f.title} (${f.internalName})` })),
    [fields]
  );

  const isScatter = draft.chartType === 'scatter';
  const isGauge = draft.chartType === 'gauge';
  const isCategoryValue = CATEGORY_VALUE_CHARTS.indexOf(draft.chartType) !== -1;
  const supportsSeries = isCategoryValue && draft.chartType !== 'pie' && draft.chartType !== 'doughnut';

  const canSave =
    draft.title.trim() &&
    draft.listName.trim() &&
    (isGauge
      ? !!draft.valueField
      : isScatter
      ? !!draft.xField && !!draft.yField
      : !!draft.categoryField && !!draft.valueField);

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      type={PanelType.medium}
      headerText={tile.title === 'New chart' && !tile.listName ? 'Add chart' : 'Edit chart'}
      closeButtonAriaLabel="Close"
      isLightDismiss
      onRenderFooterContent={() => (
        <div className={styles.panelFooter}>
          <PrimaryButton text="Save" onClick={() => onSave(draft)} disabled={!canSave} />
          <DefaultButton text="Cancel" onClick={onDismiss} />
        </div>
      )}
      isFooterAtBottom
    >
      <div className={styles.panelBody}>
        <div className={styles.panelSection}>
          <Label className={styles.sectionLabel}>Appearance</Label>
          <TextField
            label="Chart title"
            value={draft.title}
            onChange={(_e, v) => setDraft({ ...draft, title: v || '' })}
          />
          <ChoiceGroup
            className={styles.panelField}
            label="Tile width"
            selectedKey={draft.width}
            options={widthOptions}
            onChange={(_e, o) => setDraft({ ...draft, width: (o?.key as 'half' | 'full') || 'half' })}
          />
          <ChoiceGroup
            className={styles.panelField}
            label="Color theme"
            selectedKey={draft.colorTheme}
            options={themeOptions}
            onChange={(_e, o) => setDraft({ ...draft, colorTheme: (o?.key as ColorTheme) || 'vivid' })}
          />
        </div>

        <Separator />

        <div className={styles.panelSection}>
          <Label className={styles.sectionLabel}>Chart type</Label>
          <Dropdown
            selectedKey={draft.chartType}
            options={chartTypeOptions}
            onChange={(_e, o) => setDraft({ ...draft, chartType: (o?.key as ChartType) || 'bar' })}
          />
        </div>

        <Separator />

        <div className={styles.panelSection}>
          <Label className={styles.sectionLabel}>Data source</Label>
          <TextField
            label="SharePoint list name"
            value={draft.listName}
            onChange={(_e, v) => setDraft({ ...draft, listName: v || '' })}
            placeholder="Exact list title"
          />

          {loadingFields && <Spinner size={SpinnerSize.small} label="Loading fields…" className={styles.panelField} />}
          {fieldsError && (
            <MessageBar messageBarType={MessageBarType.error} className={styles.panelField}>
              {fieldsError}
            </MessageBar>
          )}

          {!isScatter && !isGauge && (
            <>
              <Dropdown
                className={styles.panelField}
                label="Category field"
                selectedKey={draft.categoryField || undefined}
                options={fieldOptions}
                onChange={(_e, o) => setDraft({ ...draft, categoryField: String(o?.key || '') })}
                placeholder="Select a field"
                disabled={fieldOptions.length === 0}
              />
              <Dropdown
                className={styles.panelField}
                label="Value field (numeric)"
                selectedKey={draft.valueField || undefined}
                options={fieldOptions}
                onChange={(_e, o) => setDraft({ ...draft, valueField: String(o?.key || '') })}
                placeholder="Select a field"
                disabled={fieldOptions.length === 0}
              />
              {supportsSeries && (
                <Dropdown
                  className={styles.panelField}
                  label="Split into series by (optional)"
                  selectedKey={draft.seriesField || undefined}
                  options={[{ key: '', text: 'None' }, ...fieldOptions]}
                  onChange={(_e, o) => setDraft({ ...draft, seriesField: String(o?.key || '') })}
                  disabled={fieldOptions.length === 0}
                />
              )}
            </>
          )}

          {isScatter && (
            <>
              <Dropdown
                className={styles.panelField}
                label="X field (numeric)"
                selectedKey={draft.xField || undefined}
                options={fieldOptions}
                onChange={(_e, o) => setDraft({ ...draft, xField: String(o?.key || '') })}
                disabled={fieldOptions.length === 0}
              />
              <Dropdown
                className={styles.panelField}
                label="Y field (numeric)"
                selectedKey={draft.yField || undefined}
                options={fieldOptions}
                onChange={(_e, o) => setDraft({ ...draft, yField: String(o?.key || '') })}
                disabled={fieldOptions.length === 0}
              />
              <Dropdown
                className={styles.panelField}
                label="Split into series by (optional)"
                selectedKey={draft.seriesField || undefined}
                options={[{ key: '', text: 'None' }, ...fieldOptions]}
                onChange={(_e, o) => setDraft({ ...draft, seriesField: String(o?.key || '') })}
                disabled={fieldOptions.length === 0}
              />
            </>
          )}

          {isGauge && (
            <>
              <Dropdown
                className={styles.panelField}
                label="Value field (numeric, summed)"
                selectedKey={draft.valueField || undefined}
                options={fieldOptions}
                onChange={(_e, o) => setDraft({ ...draft, valueField: String(o?.key || '') })}
                disabled={fieldOptions.length === 0}
              />
              <TextField
                className={styles.panelField}
                label="Minimum"
                type="number"
                value={String(draft.minValue)}
                onChange={(_e, v) => setDraft({ ...draft, minValue: parseFloat(v || '0') || 0 })}
              />
              <TextField
                className={styles.panelField}
                label="Maximum"
                type="number"
                value={String(draft.maxValue)}
                onChange={(_e, v) => setDraft({ ...draft, maxValue: parseFloat(v || '0') || 0 })}
              />
              <TextField
                className={styles.panelField}
                label="Target (optional marker)"
                type="number"
                value={String(draft.targetValue)}
                onChange={(_e, v) => setDraft({ ...draft, targetValue: parseFloat(v || '0') || 0 })}
              />
            </>
          )}
        </div>
      </div>
    </Panel>
  );
};

export default TileConfigPanel;
