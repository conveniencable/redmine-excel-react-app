export type NotificationMessage = {
  id: number;
  info: boolean;
  error: boolean;
  success: boolean;
  warning: boolean;
  message: string;
  messageParameters?: any;
  time: number;
  isHolding: boolean;
};

class NotificationControl {
  static currentId = 0;
  receiver: (message: NotificationMessage) => void;
  queue: NotificationMessage[] = [];

  public showError(message: string, parameters = null, time = 5, messageParameters?: any) {
    this.showMessage(message, parameters, time, messageParameters, false, false, false, true);
  }

  public showSuccess(message: string, parameters = null, time = 5, messageParameters?: any) {
    this.showMessage(message, parameters, time, messageParameters, false, true, false, false);
  }

  public showwarning(message: string, parameters = null, time = 5, messageParameters?: any) {
    this.showMessage(message, parameters, time, messageParameters, false, false, true, false);
  }

  public showInfo(message: string, parameters = null, time = 5, messageParameters?: any) {
    this.showMessage(message, parameters, time, messageParameters, true, false, false, false);
  }

  private showMessage(
    message: string,
    parameters = null,
    time = 5,
    messageParameters = null,
    info = false,
    success = false,
    warning = false,
    error = false
  ) {
    const messageObj: NotificationMessage = {
      id: ++NotificationControl.currentId,
      info,
      error,
      success,
      warning,
      time,
      messageParameters,
      isHolding: false,
      message: message
    };

    if (this.receiver) {
      this.receiver(messageObj);
    } else {
      this.queue.push(messageObj);
    }

    if (NotificationControl.currentId >= Number.MAX_VALUE) {
      NotificationControl.currentId = 0;
    }
  }

  public onMessage(onMessage: (message: NotificationMessage) => void) {
    this.receiver = onMessage;
    if (this.queue.length > 0) {
      for (const m of this.queue) {
        onMessage(m);
      }

      this.queue = [];
    }
  }
}

export const notificationControl = new NotificationControl();
