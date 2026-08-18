import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version, DisplayMode } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPHttpClient } from '@microsoft/sp-http';

import * as strings from 'ChartStudioWebPartStrings';
import ChartStudio from './components/ChartStudio';
import { IChartStudioProps } from './components/IChartStudioProps';
import { IChartStudioWebPartProps } from './IChartStudioWebPartProps';
import { IChartTile } from './components/ChartStudioTypes';

export default class ChartStudioWebPart extends BaseClientSideWebPart<IChartStudioWebPartProps> {

  private handleTilesChange = (tiles: IChartTile[]): void => {
    this.properties.tilesJson = JSON.stringify(tiles);
    this.render();
  };

  public render(): void {
    let tiles: IChartTile[] = [];
    try {
      tiles = JSON.parse(this.properties.tilesJson || '[]');
    } catch {
      tiles = [];
    }

    const element: React.ReactElement<IChartStudioProps> = React.createElement(
      ChartStudio,
      {
        studioTitle: this.properties.studioTitle,
        tiles,
        onTilesChange: this.handleTilesChange,
        isEditMode: this.displayMode === DisplayMode.Edit,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        spHttpClient: this.context.spHttpClient as unknown as SPHttpClient
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('studioTitle', { label: strings.StudioTitleFieldLabel })
              ]
            }
          ]
        }
      ]
    };
  }
}
