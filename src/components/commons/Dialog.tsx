import * as React from 'react';
import { DialogMessage, dialogControl } from '../../controls/dialog-control';
import { Modal, Button } from 'semantic-ui-react';
import T from './T';
import _ = require('lodash');

export function DialogComponent() {
  const [messages, setMessages] = React.useState<DialogMessage[]>([]);

  React.useEffect(() => {
    dialogControl.onMessage((message: DialogMessage) => {
      setMessages(originalMessages => [...originalMessages, message]);
    });

    return () => dialogControl.offMessage();
  }, []);

  const closeMessage = React.useCallback((id: number) => {
    setMessages(originalMessages => originalMessages.map(m => (m.id === id ? { ...m, open: false } : m)));
  }, []);

  const makeActionLoading = React.useCallback((id: number, actionIndex: number) => {
    setMessages(originalMessages =>
      originalMessages.map(m => {
        if (m.id === id) {
          const newM = _.cloneDeep(m);
          newM.actions[actionIndex].loading = true;

          return newM;
        } else {
          return m;
        }
      })
    );
  }, []);

  return (
    <>
      {messages.map((message: DialogMessage) => {
        return (
          <Modal
            key={message.id}
            closeOnEscape={false}
            closeOnDimmerClick={false}
            open={message.open}
            onUnmount={() => {
              setMessages(originalMessages => originalMessages.filter(m => m.id !== message.id));
            }}
          >
            <Modal.Header>
              <T message={message.title}></T>
            </Modal.Header>
            <Modal.Content>{_.isString(message.message) ? message.message : <T {...message.message}></T>}</Modal.Content>
            <Modal.Actions>
              {message.actions &&
                message.actions.map((action, index) => {
                  return (
                    <Button
                      onClick={e => {
                        if (action.action) {
                          const done = action.action(action.data);
                          if (done) {
                            makeActionLoading(message.id, index);
                            done.finally(() => {
                              closeMessage(message.id);
                            });
                          } else {
                            closeMessage(message.id);
                          }
                        } else {
                          closeMessage(message.id);
                        }
                      }}
                      loading={action.loading}
                      icon={action.icon}
                      color={action.color}
                      key={index}
                    >
                      <T message={action.text}></T>
                    </Button>
                  );
                })}
            </Modal.Actions>
          </Modal>
        );
      })}
    </>
  );
}
