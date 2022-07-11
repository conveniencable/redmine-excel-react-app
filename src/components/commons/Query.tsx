import _ = require('lodash');
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Divider, Dropdown, Form, Input, Label, Modal, Segment, Select, Table } from 'semantic-ui-react';
import { httpRequest } from '../../http-client';
import { NO_VALUE_OPERATORS, QueryData, QueryFilter, QuerySetting, QueryValue } from '../../models/query.model';
import * as arrayMove from 'array-move';
import T, { translate } from './T';
import QuerySelector from './QuerySelector';
import { values } from 'lodash';
import { settings } from 'cluster';
import { correctQueryValue, getColumnName, getColumnNameNumber } from '../../helpers/my_helper';
import { value } from 'popmotion';
import { useCallback } from 'hoist-non-react-statics/node_modules/@types/react';
import { notificationControl } from '../../controls/notification-control';

export function Query(props: {
  value: QueryValue;
  onChange: (value: QueryValue) => void;
  onLoad: (isMerge: boolean) => void;
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
  const [openColumnPosition, setOpenColumnPosition] = useState(false);
  const [columnErrors, setColumnErrors] = useState<{ [name: string]: string }>({});

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

  useEffect(() => {
    const errors: { [name: string]: string } = {};
    const repeatPositions: { [position: string]: number } = {};
    for (const p of query.columnPositions) {
      if (repeatPositions[p]) {
        ++repeatPositions[p];
      } else {
        repeatPositions[p] = 1;
      }
    }

    const columnInformations = query.columns.map((c, index) => [c, query.columnPositions[index]]);

    columnInformations.forEach(ci => {
      if (!ci[1]) {
        errors[ci[0]] = translate('field_is_required');
      } else if (repeatPositions[ci[1]] > 1) {
        errors[ci[0]] = translate('error_excel_column_repeat');
      } else if (ci[1] > 16384) {
        // large than XFD

        errors[ci[0]] = translate('error_excel_column_exceed_xfd');
      }
    });

    setColumnErrors(errors);
  }, [query.columns, query.columnPositions]);

  const hasInvalidFilter = !!query.filters.find(filter => !NO_VALUE_OPERATORS.includes(filter.operator) && filter.invalid);
  const hasColumnError = !_.isEmpty(columnErrors);

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

            props.onChange(correctQueryValue({ projectId: newProjectId, sort, query: newQuery || { ...query, id: null } }));
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

                          props.onChange({
                            projectId,
                            sort,
                            query: onSelectFilter({ fieldName, operator: operators[0], values: [] }, query)
                          });
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

        <Dropdown direction="left" icon="setting" button className="icon mini primary right floated">
          <Dropdown.Menu>
            {[
              { text: translate('label_sort'), value: 'sort', key: 'sort', icon: 'ordered list', onClick: () => setOpenSort(true) },
              { text: translate('label_column_position'), value: 'map', key: 'map', icon: 'ordered list', onClick: () => setOpenColumnPosition(true) }
            ].map(option => (
              <Dropdown.Item key={option.value} {...option} />
            ))}
          </Dropdown.Menu>
        </Dropdown>
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

                          props.onChange({
                            projectId,
                            sort,
                            query: { ...query, filters: query.filters.filter(f => f.fieldName !== s.fieldName) }
                          });
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
        <div style={{ display: 'flex' }}>
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
                      const columns = query.columns;
                      const columnPositions = query.columnPositions;
                      if (!columns.includes(data.value as string)) {
                        props.onChange({
                          projectId,
                          sort,
                          query: {
                            ...query,
                            columns: [...columns, data.value as string],
                            columnPositions: [...columnPositions, columnPositions[columnPositions.length - 1] + 1]
                          }
                        });
                      }
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
          <Input
            value={query.startRow}
            onChange={e =>
              props.onChange({
                projectId,
                sort,
                query: {
                  ...query,
                  startRow: parseInt(e.target.value)
                }
              })
            }
            type="number"
            min="1"
            pattern="\d+"
            size="mini"
            label={translate('excel_title_row')}
            style={{ flex: 1 }}
          />
        </div>
        <div>
          <ColumnEditor
            availableColumns={querySetting.availableColumns}
            columns={query.columns}
            columnPositions={query.columnPositions}
            errors={columnErrors}
            onChange={(columns, columnPositions) => {
              props.onChange({ projectId, sort, query: { ...query, columns, columnPositions } });
            }}
          />
        </div>
      </Segment>
      <Segment>
        <Button
          color="blue"
          disabled={hasInvalidFilter || hasColumnError}
          onClick={() => {
            props.onLoad(false);
          }}
        >
          <T>button_load</T>
        </Button>

        <Button
          color="blue"
          disabled={hasInvalidFilter || hasColumnError}
          onClick={() => {
            props.onLoad(true);
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

const ColumnEditor = (props: {
  availableColumns: string[][];
  columns: string[];
  columnPositions: number[];
  errors: { [name: string]: string };
  onChange: (columns: string[], positions: number[]) => void;
}) => {
  const { availableColumns, columns, columnPositions, errors } = props;
  const [positions, setPositions] = useState<string[]>(columnPositions.map(p => getColumnName(p)));
  const [list, setList] = useState<{ name: string; label: string }[]>([]);
  useEffect(() => {
    const newList: { name: string; label: string }[] = [];
    columns.forEach((c, i) => {
      const option = availableColumns.find(o => o[1] === c);
      if (option) {
        newList.push({ name: c, label: option[0] });
      }
    });
    setList(newList);
  }, [availableColumns, columns]);

  useEffect(() => {
    setPositions(columnPositions.map(p => getColumnName(p)));
  }, [columnPositions]);

  return (
    <div>
      {list.map((value, index) => {
        return (
          <div
            key={value.name}
            title={errors[value.name] || ''}
            className={`ui image small label ${errors[value.name] ? 'red' : ''}`}
            style={{ margin: '5px 5px 0 0' }}
          >
            <input
              style={{ width: '2.2rem', marginRight: '0.5rem', fontSize: '80%' }}
              value={positions[index]}
              pattern="[A-Z]"
              onChange={e => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                setPositions(ps => ps.map((p, i) => (i === index ? value : p)));
              }}
              onBlur={e => {
                updateColumns(positions, columns, props.onChange);
              }}
            />
            {value.label}
            {value.name !== 'id' && (
              <i
                className="delete icon"
                onClick={() => {
                  updateColumns(
                    positions.filter((v, i) => i !== index),
                    columns.filter((v, i) => i !== index),
                    props.onChange
                  );
                }}
              ></i>
            )}
          </div>
        );
      })}
    </div>
  );
};

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

function updateColumns(positions: string[], columns: string[], onChange: (columns: string[], positions: number[]) => void) {
  const columnInformations = columns
    .map((c, index) => [c, getColumnNameNumber(positions[index])])
    .sort((a, b) => (a[1] === b[1] ? 0 : a[1] > b[1] ? 1 : -1));

  const newColumnPositions = columnInformations.map(v => v[1]) as number[];
  onChange(columnInformations.map(v => v[0]) as string[], newColumnPositions);
}
