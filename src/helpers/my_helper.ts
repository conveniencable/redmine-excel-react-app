export function sendCommand(command: string, ...data: any) {
  const anywin = window as any;
  if (anywin.chrome.webview && anywin.chrome.webview.postMessage) {
    anywin.chrome.webview.postMessage(JSON.stringify([command, ...data.map(d => JSON.stringify(d))]));
  } else {
    console.log('send command', command, data);
  }
}
