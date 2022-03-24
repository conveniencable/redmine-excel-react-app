export interface QuerySetting {
  filterOptions: { [groupName: string]: [string, string][] };
  operatorLabels: { [label: string]: string };
  operatorByType: { [operatorName: string]: string[] };
  availableFilters: { [fieldName: string]: { type: string; name: string; values: [string, string][]; field_format: string; remote: boolean } };
  availableColumns: [string, string][];
}

export interface QueryFilter {
  fieldName: string;
  operator: string;
  values?: string[];
}

export interface QueryData {
  id: number;
  name: string;
  columns: string[];
  filters: QueryFilter[];
}

export interface QueryParams {
  f: string[];
  op: { [fieldName: string]: string };
  v: { [fieldName: string]: string[] };
  c: string[];
  set_filter?: number;

  project_id?: number;

  offset?: number;
  limit?: number;
  sort: { [index: number]: string[] };
}

export interface Issues {
  offset: number;
  limit: number;
  total_count: number;
  issues: any[];
}

export const NO_VALUE_OPERATORS = ['!*', '*', 'nd', 't', 'ld', 'nw', 'w', 'lw', 'l2w', 'nm', 'm', 'lm', 'y', 'o', 'c', '*o', '!o'];
