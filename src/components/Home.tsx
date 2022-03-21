import * as React from 'react';
import '../assets/scss/Home.scss';
import { useLocation, useHistory } from 'react-router-dom';
import { routerControl } from '../controls/route-control';
import { Query } from './commons/Query';
import { Issues, QueryData, QueryParams } from '../models/query.model';
import { useCurrentUser } from '../hooks/auth-hook';
import { useCallback, useEffect, useState } from 'react';
import { httpRequest } from '../http-client';
import { Dimmer, Loader } from 'semantic-ui-react';
import { sendCommand } from '../helpers/my_helper';
import { dialogControl } from '../controls/dialog-control';
import ExcelList from './commons/ExcelList';
import { RespCode } from '../models/system.model';
import { notificationControl } from '../controls/notification-control';
import { off } from 'process';
import { translate } from './commons/T';

const QUERY_CACHE_KEY = '_query';

// before component load
(window as any).switchQuery = (queryStr: string) => {
  if (queryStr) {
    cacheQuery = JSON.parse(queryStr);
  }
};

let cacheQuery: { projectId: number; query: QueryData; sort: string[][] } = JSON.parse(localStorage.getItem(QUERY_CACHE_KEY));

export default function HomeComponent() {
  const currentUser = useCurrentUser();

  const location = useLocation();
  const history = useHistory();
  const [selectedQuery, setSelectedQuery] = useState<{ projectId: number; query: QueryData; sort: string[][] }>();
  useEffect(() => {
    const queryObj = cacheQuery || { projectId: 0, query: currentUser.default_query, sort: [] };
    setSelectedQuery(queryObj);

    const queryStr = JSON.stringify(queryObj);
    cacheQuery = null;

    sendCommand('updateQuery', queryStr, 'init');
  }, []);

  const [loading, setLoading] = useState(false);
  routerControl.init(location, history);

  (window as any).switchQuery = (queryStr: string) => {
    if (queryStr) {
      setSelectedQuery(JSON.parse(queryStr));
    }
  };

  const onLoad = useCallback(
    (columns: { name: string; label: string }[], sort: string[][], isMerge: boolean) => {
      const startToLoad = () => {
        const formatSort = {};
        sort.forEach((s, i) => (formatSort[i] = s));
        const params: QueryParams = {
          f: [],
          op: {},
          v: {},
          c: selectedQuery.query.columns,
          sort: formatSort,
          set_filter: 1
        };

        if (selectedQuery.projectId) {
          params.project_id = selectedQuery.projectId;
        }

        for (const f of selectedQuery.query.filters) {
          if (!selectedQuery.projectId || f.fieldName !== 'project_id') {
            params.f.push(f.fieldName);
            params.op[f.fieldName] = f.operator;
            params.v[f.fieldName] = f.values;
          }
        }
        setLoading(true);

        const loadIssues = (offset?: number, limit?: number, total_count?: number) => {
          console.log('load issue', offset, limit);
          return httpRequest<QueryParams, Issues>('api/issues', 'get', { ...params, offset, limit })
            .then(resp => {
              if (resp.code === RespCode.OK) {
                sendCommand('loadIssues', resp.data, isMerge);
              } else {
                notificationControl.showError('Load Issue Error: ' + resp.message);
                setLoading(false);
              }
            })
            .catch(err => {
              notificationControl.showError('Load Issue Error: ' + err);
              setLoading(false);
            });
        };
        (window as any).loadIssues = loadIssues;

        loadIssues();

        (window as any).loadIssueDone = () => {
          setLoading(false);
        };
      };
      (window as any).beforeLoadIssue = (isChange: boolean) => {
        if (isChange) {
          dialogControl.confirm(translate('confirm_overload'), (agree: boolean) => {
            if (agree) {
              startToLoad();
            }

            return Promise.resolve(true);
          });
        } else {
          startToLoad();
        }
      };
      sendCommand('beforeLoadIssue', isMerge);

      (window as any).afterLoadIssue = (issue_ids: number[]) => {
        httpRequest('api/after_load_issue', 'post', { issue_ids })
          .then(resp => {
            if (resp.code === RespCode.OK) {
              sendCommand('afterLoadIssue', resp.data);
            } else {
              notificationControl.showError('After Load Issue Error: ' + resp.message);
              setLoading(false);
            }
          })
          .catch(err => {
            notificationControl.showError('After Load Issue Error: ' + err);
            setLoading(false);
          });
      };
    },
    [selectedQuery]
  );

  const onSave = useCallback(() => {
    setLoading(true);
    sendCommand('saveIssues');

    (window as any).saveToRedmine = (headers: string[], issues: string[][], project_id: string, id_to_line_no: string[]) => {
      httpRequest('api/issues', 'post', { headers, issues, project_id, id_to_line_no }).then(resp => {
        if (resp.code == RespCode.OK) {
          sendCommand('afterSaveIssues', resp.data);
        } else {
          notificationControl.showError('Load Issue Error: ' + resp.message);
          setLoading(false);
        }
      });
    };

    (window as any).saveToRedmineDone = (isEmpty = false) => {
      setLoading(false);
      if (isEmpty) {
        notificationControl.showInfo('Nothing is changed');
      }
    };
  }, [selectedQuery]);

  return (
    <div>
      <Dimmer active={loading} inverted>
        <Loader />
      </Dimmer>
      {selectedQuery && (
        <Query
          value={selectedQuery}
          onChange={query => {
            setSelectedQuery(query);
            const queryStr = JSON.stringify(query);
            sendCommand('updateQuery', queryStr, '');
            localStorage.setItem(QUERY_CACHE_KEY, queryStr);
          }}
          onLoad={onLoad}
          onSave={onSave}
          loadingChange={setLoading}
        />
      )}
      <ExcelList></ExcelList>
    </div>
  );
}
