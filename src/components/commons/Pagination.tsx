import * as React from 'react';
import * as classnames from 'classnames';

import * as _ from 'lodash';
import { Page } from '../../models/system.model';
import { Form, Select } from 'semantic-ui-react';

export default class Pagination<D> extends React.PureComponent<
  {
    page: Page<D>;
    availablePageSizes: number[];
    onChange: (pageIndex: number, pageSize: number) => void;
  },
  any
> {
  render() {
    const { page, availablePageSizes, onChange } = this.props;

    const noPage = !page || !page.length || page.length < page.pageSize;

    if (noPage) {
      return <span></span>;
    }

    const totalPage = Math.ceil(page.length / page.pageSize);

    let start = page.pageIndex - 5;
    if (start < 0) {
      start = 0;
    }

    let end = start + 10;
    if (end > totalPage) {
      const diff = end - totalPage;
      end -= diff;

      start -= diff;
      if (start < 0) {
        start = 0;
      }
    }

    return (
      <div className="ui right floated compact pagination menu">
        <a
          className={classnames('icon item', {
            disabled: page.pageIndex === 0
          })}
          onClick={e => onChange(0, page.pageSize)}
        >
          <i className="angle double left icon"></i>
        </a>
        <a
          className={classnames('icon item', {
            disabled: page.pageIndex === 0
          })}
          onClick={e => onChange(page.pageIndex - 1, page.pageSize)}
        >
          <i className="angle left icon"></i>
        </a>
        {_.range(start, end).map(n => {
          return (
            <a
              key={n}
              className={classnames('item', { blue: n === page.pageIndex }, { disabled: n === page.pageIndex })}
              onClick={e => onChange(n, page.pageSize)}
            >
              {n + 1}
            </a>
          );
        })}

        <a
          className={classnames('icon item', {
            disabled: page.pageIndex === totalPage - 1
          })}
          onClick={e => onChange(page.pageIndex + 1, page.pageSize)}
        >
          <i className="angle right icon"></i>
        </a>
        <a
          className={classnames('icon item', {
            disabled: page.pageIndex === totalPage - 1
          })}
          onClick={e => onChange(totalPage - 1, page.pageSize)}
        >
          <i className="angle double right icon"></i>
        </a>
        <span className="item" style={{ padding: '0 2px' }}>
          <Select
            style={{ border: 'none' }}
            compact
            options={availablePageSizes.map(size => ({
              text: size,
              value: size
            }))}
            defaultValue={(page && page.pageSize) || availablePageSizes[0]}
            onChange={(e, data) => onChange(page.pageIndex, parseInt(data.value + '', 10))}
            size="mini"
          ></Select>
        </span>
      </div>
    );
  }
}
