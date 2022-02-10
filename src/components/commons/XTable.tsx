import * as React from 'react';
import { Icon } from 'semantic-ui-react';
import '../../assets/scss/components/commons/XTable.scss';
import { DataType, ValueType } from '../../models/commons.model';
import { Page } from '../../models/system.model';
import _ = require('lodash');
import moment = require('moment');
import { useTable } from 'react-table';
import Pagination from './Pagination';
import { useStickyTableLayout, useDeepEffect } from '../../hooks/util-hooks';
import T from './T';
import classNames = require('classnames');

export interface XTableColumn {
  title?: string;
  fieldName: string;
  dataType?: DataType;
  formater?: (row, index: number) => any;
}

export interface XTableControl {
  appendRow(rowData: any);
  prependRow(rowData: any);
  removeRow(index: number);
  updateRow(newRowData, index: number);
}

export function XTable(props: {
  columns: XTableColumn[];
  pageData: Page<any>;
  availablePageSizes: number[];
  onPageChange: (pageIndex: number, pageSize: number) => any;
  controlRef?: React.MutableRefObject<XTableControl>;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  const propsDataList = props.pageData ? props.pageData.content : [];
  const [dataList, setDataList] = React.useState<any[]>(propsDataList);

  useDeepEffect(() => {
    if (!_.isEqual(dataList, propsDataList)) {
      setDataList(propsDataList);
    }
  }, [propsDataList]);

  if (props.controlRef) {
    const xTableControl: XTableControl = {
      appendRow: (rowData: any) => {
        setDataList([...dataList, rowData]);
      },
      prependRow: (rowData: any) => {
        setDataList([rowData, ...dataList]);
      },
      removeRow: (index: number) => {
        setDataList(dataList.filter((d, i) => i !== index));
      },
      updateRow: (newRowData: number, index: number) => {
        setDataList(dataList.map((d, i) => (index === i ? newRowData : d)));
      }
    };
    props.controlRef.current = xTableControl;
  }

  const headerTexts = props.columns.map((c, i) => {
    if (!c.title) {
      return '';
    }

    return _.isFunction(c.title) ? c.title(i) : c.title;
  });

  const tableData = dataList.map((row, index) => {
    const rowData = props.columns.map(column => {
      let value;
      if (column.formater) {
        value = column.formater(row, index);
      } else {
        const rawValue = row[column.fieldName];
        value = XValueView(column.dataType, rawValue);
      }

      return value;
    });

    return rowData;
  });

  const columns = React.useMemo(() => {
    return props.columns.map((column, i) => {
      return {
        Header: column.fieldName,
        accessor: column.fieldName
      };
    });
  }, [props.columns]);

  const data = React.useMemo(
    () =>
      dataList.map((row, index) => {
        const values = {};
        for (const c of props.columns) {
          values[c.fieldName] = 1;
        }

        return values;
      }),
    [dataList]
  );

  const { getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data
    },
    useStickyTableLayout
  );

  const hasFooter = props.pageData && props.pageData.length > props.pageData.pageSize;

  return (
    <div ref={rootRef} className="xtable-scroll-wrap">
      <div className="xtable-header-wrap">
        <table className="ui striped fixed celled table">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, columnIndex) => (
                  <th {...column.getHeaderProps()}>{headerTexts[columnIndex]}</th>
                ))}
              </tr>
            ))}
          </thead>
        </table>
      </div>

      <div className="xtable-content-wrap">
        <table
          className={classNames('ui striped fixed celled table', {
            'with-footer': hasFooter
          })}
        >
          <tbody {...getTableBodyProps()}>
            {rows.map((row, rowIndex) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell, cellIndex) => {
                    return <td {...cell.getCellProps()}>{tableData[rowIndex][cellIndex]}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasFooter ? (
        <div className="xtable-footer-wrap">
          <table className="ui striped compact celled table">
            <tfoot>
              <tr>
                <td colSpan={props.columns.length}>
                  <Pagination page={props.pageData} availablePageSizes={props.availablePageSizes} onChange={props.onPageChange}></Pagination>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function XValueView(dataType: DataType, rawValue: any) {
  let value = rawValue;

  if (rawValue !== null && rawValue !== undefined) {
    switch (dataType.valueType) {
      case ValueType.Boolean:
        value = rawValue ? <Icon name="check" color="olive"></Icon> : '';
        break;
      case ValueType.String:
        break;
      case ValueType.Integer:
        break;
      case ValueType.Long:
        value = rawValue;
        break;
      case ValueType.Double:
        break;
      case ValueType.Decimal:
        break;
      case ValueType.Date:
        value = moment(rawValue).format('YYYY-MM-DD');
        break;
      case ValueType.DateTime:
        value = moment(rawValue).format('YYYY-MM-DD HH:mm');

        break;
      case ValueType.File:
        break;

      default:
        break;
    }
  }

  return value;
}
