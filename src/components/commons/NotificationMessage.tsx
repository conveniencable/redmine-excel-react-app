import * as React from 'react';
import { Message, Label } from 'semantic-ui-react';
import { notificationControl, NotificationMessage } from '../../controls/notification-control';
import T from './T';
import { motion, AnimatePresence } from 'framer-motion';
import '../../assets/scss/components/commons/NotificationMessage.scss';
import _ = require('lodash');

export default class NotificationMessageComponent extends React.PureComponent<any, { messages: NotificationMessage[] }> {
  state = { messages: [] };
  intervalHandler: any;

  constructor(props) {
    super(props);

    notificationControl.onMessage((message: NotificationMessage) => {
      this.setState({ messages: [...this.state.messages, message] });
    });
  }

  render() {
    return (
      <div className="notification-messages-container">
        <div className="wrapper">
          <AnimatePresence>
            {this.state.messages.map((message, index) => (
              <motion.div
                className="message-animation"
                initial={{ opacity: 0, y: 500 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -500 }}
                onMouseEnter={() => this.holdingMessage(message.id)}
                onMouseOut={() => this.stopHoldingMessage(message.id)}
                key={message.id}
              >
                <Message {..._.pick(message, 'info', 'error', 'success', 'warning')} onDismiss={() => this.dismissMessage(message.id)}>
                  <Message.Header>
                    <T>Warning</T>
                    <Label style={{ opacity: message.isHolding ? 0 : 1 }} as="span" circular>
                      {message.time}
                    </Label>
                  </Message.Header>
                  <p>{message.message}</p>
                </Message>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  dismissMessage(id: number) {
    this.setState({
      messages: this.state.messages.filter(m => m.id !== id)
    });
  }

  holdingMessage(id: number) {
    this.setState({
      messages: this.state.messages.map(m => {
        if (m.id === id) {
          m.isHolding = true;
        }

        return m;
      })
    });
  }

  stopHoldingMessage(id: number) {
    this.setState({
      messages: this.state.messages.map(m => {
        if (m.id === id) {
          m.isHolding = false;
        }

        return m;
      })
    });
  }

  componentDidMount() {
    clearInterval(this.intervalHandler);
    this.intervalHandler = setInterval(() => {
      const messages = this.state.messages.filter(message => {
        return message.isHolding || --message.time >= 0;
      });

      this.setState({ messages });
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalHandler);
  }
}
