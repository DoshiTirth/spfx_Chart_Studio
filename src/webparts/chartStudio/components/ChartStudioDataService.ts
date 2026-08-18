import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { IListItemRecord } from './ChartStudioTypes';

const PAGE_SIZE = 500;

export async function fetchAllListItems(
  spHttpClient: SPHttpClient,
  siteUrl: string,
  listName: string,
  fields: string[]
): Promise<IListItemRecord[]> {
  const cleanFields = Array.from(new Set(fields.filter(Boolean)));
  const select = ['Id', ...cleanFields].join(',');
  const encodedList = encodeURIComponent(listName.replace(/'/g, "''"));

  let url =
    `${siteUrl}/_api/web/lists/getbytitle('${encodedList}')/items` +
    `?$select=${select}&$top=${PAGE_SIZE}`;

  const items: IListItemRecord[] = [];

  while (url) {
    const response: SPHttpClientResponse = await spHttpClient.get(url, SPHttpClient.configurations.v1);
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SharePoint REST call failed (${response.status}): ${body}`);
    }
    const json = await response.json();
    items.push(...(json.value as IListItemRecord[]));
    url = json['odata.nextLink'] || json['@odata.nextLink'] || '';
  }

  return items;
}

export interface IListField {
  internalName: string;
  title: string;
}

/** Fetches user-facing, non-hidden fields for a list, used to populate field pickers. */
export async function fetchListFields(
  spHttpClient: SPHttpClient,
  siteUrl: string,
  listName: string
): Promise<IListField[]> {
  const encodedList = encodeURIComponent(listName.replace(/'/g, "''"));
  const url =
    `${siteUrl}/_api/web/lists/getbytitle('${encodedList}')/fields` +
    `?$select=InternalName,Title,Hidden,ReadOnlyField,FromBaseType&$filter=Hidden eq false`;

  const response = await spHttpClient.get(url, SPHttpClient.configurations.v1);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to load list fields (${response.status}): ${body}`);
  }
  const json = await response.json();
  return (json.value as Array<{ InternalName: string; Title: string; ReadOnlyField: boolean }>)
    .filter((f) => !f.ReadOnlyField)
    .map((f) => ({ internalName: f.InternalName, title: f.Title || f.InternalName }));
}
