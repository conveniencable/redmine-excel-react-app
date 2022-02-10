import { SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic';

type DialogAction = (data?: any) => Promise<any>;

export interface DialogMessage {
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  actions: {
    text: string;
    icon?: string;
    color?: SemanticCOLORS;
    action?: DialogAction;
    data?: any;
    loading?: boolean;
  }[];
  id?: number;
  open?: boolean;
}

class DialogControl {
  static currentId = 0;
  receiver: (message: DialogMessage) => void;
  queue: DialogMessage[] = [];

  private show(message: DialogMessage) {
    message.id = ++DialogControl.currentId;
    message.open = true;
    if (this.receiver) {
      this.receiver(message);
    } else {
      this.queue.push(message);
    }

    if (DialogControl.currentId >= Number.MAX_VALUE) {
      DialogControl.currentId = 0;
    }
  }

  public alert(message: string, action?: DialogAction, parameters?: { [key: string]: string } | string, tag?: string, plural?: boolean) {
    this.show({
      title: 'Warming',
      message,
      type: 'alert',
      actions: [{ text: 'Confirm', action }]
    });
  }

  public alertText(message: string, action?: DialogAction) {
    this.show({
      title: 'Alert',
      message,
      type: 'alert',
      actions: [{ text: 'Confirm', action }]
    });
  }

  public confirm(
    message: string,
    action?: (agree: boolean) => Promise<any>,
    parameters?: { [key: string]: string } | string,
    tag?: string,
    plural?: boolean
  ) {
    this.show({
      title: 'Warning',
      message,
      type: 'confirm',
      actions: [
        { text: 'Cancel', action, data: false },
        { text: 'Confirm', action, data: true }
      ]
    });
  }

  public deletionConfirm(targetName: string, action: DialogAction, description?: string) {
    this.show({
      title: 'Are You Sure Want to Delete?',
      message: 'This action cannot be undone',
      type: 'confirm',
      actions: [
        { text: 'Cancel', action, data: false },
        { text: 'Confirm', action, data: true }
      ]
    });
  }

  public onMessage(onMessage: (message: DialogMessage) => void) {
    this.receiver = onMessage;
    if (this.queue.length > 0) {
      for (const m of this.queue) {
        onMessage(m);
      }

      this.queue = [];
    }
  }

  public offMessage() {
    this.receiver = null;
  }
}

export const dialogControl = new DialogControl();
