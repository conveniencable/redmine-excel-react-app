import _ = require('lodash');
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Dropdown, Input, Label, Modal, Segment, Select, Table } from 'semantic-ui-react';
import { httpRequest } from '../../http-client';
import { NO_VALUE_OPERATORS, QueryData, QueryFilter, QuerySetting } from '../../models/query.model';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import * as arrayMove from 'array-move';
import T, { translate } from './T';
import QuerySelector from './QuerySelector';
import { values } from 'lodash';
import { settings } from 'cluster';

export function Query(props: {
  value: { projectId: number; query: QueryData; sort: string[][] };
  onChange: (value: { projectId: number; query: QueryData; sort: string[][] }) => void;
  onLoad: (columns: { name: string; label: string }[], sort: string[][], isMerge: boolean) => void;
  onSave: () => void;
  loadingChange: (loading: boolean) => void;
}) {
  const [querySetting, setQuerySetting] = useState<QuerySetting>({
    filterOptions: {},
    operatorLabels: {},
    operatorByType: {},
    availableFilters: {},
    availableColumns: []
  });

  const { projectId, query, sort } = props.value;

  const [filteredFilterOptions, setFilteredFilterOptions] = useState({});
  const [filteredColumns, setFilteredColumns] = useState([]);
  const [openSort, setOpenSort] = useState(false);

  useEffect(() => {
    httpRequest<void, QuerySetting>('api/query_settings', 'get')
      .then(data => {
        const setting = data.data;
        setQuerySetting(setting);
        setFilteredFilterOptions(setting.filterOptions);
        setFilteredColumns(setting.availableColumns);
      })
      .finally(() => props.loadingChange(false));
  }, []);

  const selectedFieldNames = query.filters.map(f => f.fieldName);

  useEffect(() => {
    if (_.isEmpty(querySetting.availableFilters)) {
      return;
    }

    const setting = { ...querySetting };
    let isChange = false;
    Promise.all(
      selectedFieldNames.map(fieldName => {
        const filterOptions = setting.availableFilters[fieldName];
        if (!filterOptions) {
          return;
        }
        const operators = setting.operatorByType[filterOptions.type];

        if (!operators) {
          return;
        }

        if (filterOptions.remote && !filterOptions.values) {
          return httpRequest<any, [string, string][]>('api/filter_values', 'get', {
            name: fieldName,
            project_id: projectId
          }).then(data => {
            isChange = true;
            setting.availableFilters[fieldName].values = data.data;
          });
        }
      })
    ).then(() => {
      if (isChange) {
        setQuerySetting(setting);
      }
    });
  }, [selectedFieldNames, querySetting, projectId]);

  const selectedColumnItems: { name: string; label: string }[] = [];
  query.columns.forEach(c => {
    const option = querySetting.availableColumns.find(o => o[1] === c);
    if (option) {
      selectedColumnItems.push({ name: c, label: option[0] });
    }
  });

  const hasInvalidFilter = !!query.filters.find(filter => !NO_VALUE_OPERATORS.includes(filter.operator) && filter.invalid);

  return (
    <Segment.Group>
      <Segment attached="top">
        <QuerySelector
          projectId={projectId}
          queryId={query.id}
          onQuerySelect={(newProjectId, newQuery) => {
            if (projectId != newProjectId) {
              // reset selectable values when project change
              const newFilters = { ...querySetting.availableFilters };
              for (const fieldName of Object.keys(newFilters)) {
                if (newFilters[fieldName].remote) {
                  newFilters[fieldName].values = null;
                }
              }
              setQuerySetting({ ...querySetting, availableFilters: newFilters });
            }

            props.onChange({ projectId: newProjectId, sort, query: newQuery || { ...query, id: null } });
          }}
        />
      </Segment>

      <Segment>
        <Dropdown text={translate('label_filter_plural')} icon="plus" floating labeled button className="icon blue mini">
          <Dropdown.Menu>
            <Input
              icon="search"
              iconPosition="left"
              className="search"
              focus
              onChange={e => {
                const searchText = (e.target.value || '').toUpperCase();
                if (searchText) {
                  const filteredValues: { [groupName: string]: [string, string][] } = {};
                  for (const groupName of Object.keys(querySetting.filterOptions)) {
                    const options = querySetting.filterOptions[groupName].filter(o => o[0].toUpperCase().includes(searchText));
                    if (options.length > 0) {
                      filteredValues[groupName] = options;
                    }
                  }

                  setFilteredFilterOptions(filteredValues);
                } else {
                  setFilteredFilterOptions(querySetting.filterOptions);
                }
              }}
              onClick={e => e.stopPropagation()}
            />
            <Dropdown.Divider />
            <Dropdown.Menu scrolling>
              {Object.keys(filteredFilterOptions).map(groupName => (
                <React.Fragment key={groupName}>
                  {groupName !== 'ungrouped' ? <Dropdown.Header icon="tag" content={groupName} /> : null}
                  {filteredFilterOptions[groupName]
                    .filter(option => !projectId || option[1] !== 'project_id')
                    .map(option => (
                      <Dropdown.Item
                        onClick={(e, data) => {
                          e.stopPropagation();
                          const fieldName = data.value as string;
                          const filterOptions = querySetting.availableFilters[fieldName];
                          if (!filterOptions) {
                            return;
                          }
                          const operators = querySetting.operatorByType[filterOptions.type];

                          if (!operators) {
                            return;
                          }

                          props.onChange({ projectId, sort, query: onSelectFilter({ fieldName, operator: operators[0], values: [] }, query) });
                        }}
                        key={option[1]}
                        value={option[1]}
                        text={option[0]}
                        disabled={selectedFieldNames.includes(option[1])}
                        icon="add"
                      />
                    ))}
                </React.Fragment>
              ))}
            </Dropdown.Menu>
          </Dropdown.Menu>
        </Dropdown>

        <Button icon="sort" floated="right" primary size="mini" content={translate('label_sort')} onClick={() => setOpenSort(true)} />
        <table className="ui mini compact striped celled table">
          <tbody>
            {query.filters
              .filter(s => !projectId || s.fieldName !== 'project_id')
              .map(s => {
                const filterOptions = querySetting.availableFilters[s.fieldName];
                if (!filterOptions) {
                  return null;
                }
                const operators = querySetting.operatorByType[filterOptions.type];

                if (!operators) {
                  return null;
                }

                const has_value = !NO_VALUE_OPERATORS.includes(s.operator);

                return (
                  <tr key={s.fieldName}>
                    <td>
                      {filterOptions.name}
                      {has_value && s.invalid && <Label color="red" basic pointing="left" content={translate('error_complete_value')}></Label>}
                    </td>
                    <td>
                      <Dropdown
                        search
                        selection
                        className="mini"
                        value={s.operator}
                        options={operators.map(o => ({ value: o, text: querySetting.operatorLabels[o], key: o }))}
                        onChange={(_, data) => {
                          props.onChange({
                            projectId,
                            sort,
                            query: onSelectFilter({ fieldName: s.fieldName, operator: data.value as string, values: [] }, query)
                          });
                        }}
                      ></Dropdown>
                    </td>
                    <td>
                      {has_value && (
                        <FilterValues
                          type={filterOptions.type}
                          operator={s.operator}
                          optionValues={filterOptions.values || []}
                          values={s.values}
                          onChange={values => {
                            props.onChange({
                              projectId,
                              sort,
                              query: onSelectFilter({ fieldName: s.fieldName, operator: s.operator, values }, query)
                            });
                          }}
                        ></FilterValues>
                      )}
                    </td>
                    <td style={{ width: '1px' }}>
                      <a
                        href="#"
                        onClick={e => {
                          e.preventDefault();

                          if (s.fieldName === 'project_id') {
                            if (projectId) {
                              const newFilters = { ...querySetting.availableFilters };
                              for (const fieldName of Object.keys(newFilters)) {
                                if (fieldName !== 'project_id' && newFilters[fieldName].remote) {
                                  newFilters[fieldName].values = null;
                                }
                              }
                              setQuerySetting({ ...querySetting, availableFilters: newFilters });
                            }
                          }

                          props.onChange({ projectId, sort, query: { ...query, filters: query.filters.filter(f => f.fieldName !== s.fieldName) } });
                        }}
                      >
                        <i className="ui red delete icon"></i>
                      </a>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </Segment>
      <Segment>
        <Dropdown text={translate('field_column_names')} icon="plus" floating labeled button className="icon blue mini">
          <Dropdown.Menu>
            <Input
              icon="search"
              iconPosition="left"
              className="search"
              focus
              onChange={(_, data) => {
                const searchText = (data.value || '').toUpperCase();
                if (searchText) {
                  setFilteredColumns(querySetting.availableColumns.filter(o => o[0].toUpperCase().includes(searchText)));
                } else {
                  setFilteredColumns(querySetting.availableColumns);
                }
              }}
              onClick={e => e.stopPropagation()}
            />
            <Dropdown.Divider />
            <Dropdown.Menu scrolling>
              {filteredColumns.map(option => (
                <Dropdown.Item
                  onClick={(e, data) => {
                    e.stopPropagation();
                    props.onChange({ projectId, sort, query: { ...query, columns: [...query.columns, data.value as string] } });
                  }}
                  key={option[1]}
                  value={option[1]}
                  text={option[0]}
                  disabled={query.columns.includes(option[1])}
                  icon="add"
                />
              ))}
            </Dropdown.Menu>
          </Dropdown.Menu>
        </Dropdown>
        <div>
          <SortableSelectedColumnList
            items={selectedColumnItems}
            axis="xy"
            distance={1}
            onDelete={name => props.onChange({ projectId, sort, query: { ...query, columns: query.columns.filter(c => c !== name) } })}
            onSortEnd={({ oldIndex, newIndex }) => {
              props.onChange({ projectId, sort, query: { ...query, columns: arrayMove(selectedColumnItems, oldIndex, newIndex).map(v => v.name) } });
            }}
          />
        </div>
      </Segment>
      <Segment>
        <Button
          color="blue"
          disabled={hasInvalidFilter}
          onClick={() => {
            props.onLoad(selectedColumnItems, sort, false);
          }}
        >
          <T>button_load</T>
        </Button>

        <Button
          color="blue"
          disabled={hasInvalidFilter}
          onClick={() => {
            props.onLoad(selectedColumnItems, sort, true);
          }}
        >
          <T>button_load_and_merge</T>
        </Button>

        <Button color="blue" onClick={props.onSave}>
          <T>button_save</T>
        </Button>
      </Segment>

      <EditSortModal
        availableColumns={[['#', 'id'], ...querySetting.availableColumns]}
        value={sort}
        onChange={sort => props.onChange({ projectId, query, sort })}
        open={openSort}
        onClose={() => setOpenSort(false)}
      />
    </Segment.Group>
  );
}

const SortableSelectedColumnItem = SortableElement((props: { name: string; label: string; onDelete: (name: string) => void }) => (
  <div className="ui image small label" style={{ margin: '5px 5px 0 0' }}>
    {props.label}
    <i className="delete icon" onClick={() => props.onDelete(props.name)}></i>
  </div>
));

const SortableSelectedColumnList = SortableContainer((props: { items: { name: string; label: string }[]; onDelete: (name: string) => void }) => {
  return (
    <div>
      {props.items.map((value, index) => (
        <SortableSelectedColumnItem key={`item-${index}`} index={index} {...value} onDelete={props.onDelete} />
      ))}
    </div>
  );
});

function FilterValues(props: { type: string; operator: string; optionValues: string[][]; values: string[]; onChange: (values: string[]) => void }) {
  switch (props.type) {
    case 'list':
    case 'list_optional':
    case 'list_status':
    case 'list_subprojects':
      return (
        <Dropdown
          multiple
          search
          selection
          value={props.values}
          options={props.optionValues.map(o => ({ value: o[1], text: o[0], key: o[1] }))}
          onChange={(_, data) => props.onChange(data.value as string[])}
          className="mini"
        ></Dropdown>
      );
    case 'date':
    case 'date_past':
      if (props.operator === '><') {
        return (
          <>
            <Input size="mini" type="date" value={props.values[0]} onChange={(_, data) => props.onChange([data.value, props.values[1] || ''])} /> -
            <Input size="mini" type="date" value={props.values[1]} onChange={(_, data) => props.onChange([props.values[1] || '', data.value])} />
          </>
        );
      } else if (['<t+', '>t+', '><t+', 't+', '>t-', '<t-', '><t-', 't-'].includes(props.operator)) {
        return (
          <Input
            size="mini"
            label={translate('day_plural')}
            type="text"
            value={props.values[0]}
            onChange={(_, data) => props.onChange([data.value])}
          />
        );
      } else {
        return <Input size="mini" type="date" value={props.values[0]} onChange={(_, data) => props.onChange([data.value, props.values[1] || ''])} />;
      }
    case 'string':
    case 'text':
      return <Input size="mini" type="text" value={props.values[0]} onChange={(_, data) => props.onChange([data.value])} />;
    case 'relation':
      if (['=p', '=!p', '!p'].includes(props.operator)) {
        return (
          <Dropdown
            size="mini"
            search
            selection
            value={props.values}
            options={props.optionValues.map(o => ({ value: o[1], text: o[0], key: o[1] }))}
            onChange={(_, data) => props.onChange(data.value as string[])}
          ></Dropdown>
        );
      } else {
        return <Input size="mini" type="text" value={props.values[0]} onChange={(_, data) => props.onChange([data.value])} />;
      }
    case 'integer':
    case 'float':
    case 'tree':
      if (props.operator === '><') {
        return (
          <>
            <Input size="mini" type="text" value={props.values[0]} onChange={(_, data) => props.onChange([data.value, props.values[1] || ''])} /> -
            <Input size="mini" type="text" value={props.values[1]} onChange={(_, data) => props.onChange([props.values[1] || '', data.value])} />
          </>
        );
      } else {
        return <Input size="mini" type="text" value={props.values[0]} onChange={(_, data) => props.onChange([data.value])} />;
      }
  }
}

function onSelectFilter(selectFilter: QueryFilter, value: QueryData): QueryData {
  let find = false;
  const newFilters = value.filters.map(f => {
    if (f.fieldName === selectFilter.fieldName) {
      find = true;
      return selectFilter;
    } else {
      return f;
    }
  });

  if (!find) {
    newFilters.push(selectFilter);
  }

  return { ...value, filters: newFilters };
}

function EditSortModal(props: {
  value: string[][];
  availableColumns: string[][];
  onChange: (value: string[][]) => void;
  open: boolean;
  onClose: () => void;
}) {
  const { value, availableColumns, onChange, open, onClose } = props;

  const selectedColumns = _.uniq(value.map(v => v[0]));

  return (
    <Modal open={open} onClose={onClose} closeIcon>
      <Modal.Header>
        <T>label_sort</T>
        <Button
          size="mini"
          icon="plus"
          primary
          onClick={() => {
            onChange([...value, ['', 'asc']]);
          }}
          style={{ marginLeft: '1rem' }}
        ></Button>
      </Modal.Header>
      <Modal.Content>
        <table style={{ width: '100%' }}>
          <tbody>
            {value.map((v, i) => (
              <tr key={i}>
                <td>
                  <Dropdown
                    size="mini"
                    compact
                    search
                    selection
                    value={v[0]}
                    options={availableColumns.map(o => ({ value: o[1], text: o[0], key: o[1], disabled: selectedColumns.includes(o[1]) }))}
                    onChange={(_, data) => {
                      onChange(value.map((vv, ii) => (i === ii ? [data.value as string, v[1]] : vv)));
                    }}
                  ></Dropdown>
                </td>
                <td>
                  <Select
                    compact
                    value={v[1]}
                    className="mini compacted"
                    options={[
                      { key: 'asc', value: 'asc', text: translate('label_ascending') },
                      { key: 'desc', value: 'desc', text: translate('label_descending') }
                    ]}
                    onChange={(_, data) => {
                      onChange(value.map((vv, ii) => (i === ii ? [vv[0], data.value as string] : vv)));
                    }}
                  ></Select>
                </td>
                <td>
                  <Button
                    size="mini"
                    icon="minus"
                    color="red"
                    onClick={() => {
                      onChange(value.filter((vv, ii) => ii !== i));
                    }}
                  ></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal.Content>
    </Modal>
  );
}
