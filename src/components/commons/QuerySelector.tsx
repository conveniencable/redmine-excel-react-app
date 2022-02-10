import classNames = require('classnames');
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Dropdown } from 'semantic-ui-react';
import { useCurrentUser } from '../../hooks/auth-hook';
import { httpRequest } from '../../http-client';
import { IdName } from '../../models/commons.model';
import { QueryData } from '../../models/query.model';
import T, { translate } from './T';

export default function QuerySelector(props: { projectId: number; queryId: number; onQuerySelect: (projectId?: number, query?: QueryData) => void }) {
  const currentUser = useCurrentUser();

  const [loading, setLoading] = useState(false);

  const [queries, setQueries] = useState<QueryData[]>([]);

  useEffect(() => {
    setLoading(true);
    httpRequest<{ project_id: number }, QueryData[]>('api/queries', 'get', { project_id: props.projectId || null })
      .then(data => {
        setQueries(data.data);
      })
      .finally(() => setLoading(false));
  }, [props.projectId]);

  return (
    <div className={classNames('ui labeled input mini compact', { loading })}>
      <div className="ui label">
        <T>query</T>
      </div>
      <Dropdown
        selection
        placeholder={translate('project')}
        value={props.projectId || 0}
        options={[{ key: 0, value: 0, text: translate('label_project_all') }].concat(
          currentUser.projects.map(p => ({ key: p.id, value: p.id, text: p.name }))
        )}
        onChange={(_, data) => {
          props.onQuerySelect(data.value as number, null);
        }}
        className="middle"
      />

      <Dropdown
        selection
        placeholder={translate('query')}
        value={props.queryId}
        options={queries.map(p => ({ key: p.id, value: p.id, text: p.name }))}
        onChange={(_, data) => {
          const queryId = data.value as number;
          const query = queries.find(q => q.id === queryId) || currentUser.default_query;
          props.onQuerySelect(props.projectId, query);
        }}
      />
    </div>
  );
}
