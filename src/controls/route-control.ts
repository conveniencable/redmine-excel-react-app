import { redminePluginUrl } from '../http-client';

export interface NavigationLink {
  label: string;
  routerLink?: string;
  labelParames?: { [name: string]: string };
  labelPlural?: boolean;
}

class RouterControl {
  private returnUrl: string;
  private _navigationLinks: NavigationLink[];
  public onNavigationLinksChange: (link: NavigationLink[]) => void;
  pusher: (url) => void = url => window.history.pushState(null, '', url);
  getCurrent: () => string = () => window.location.pathname;
  public push(url: string) {
    this.pusher(url);
  }

  public getCurentLocation() {
    return this.getCurrent();
  }

  public init(location, history) {
    this.pusher = url => history.push(url);
    this.getCurrent = () => location.pathname;
  }

  public toLoggedIn() {
    const currentUrl = this.getCurrent();
    if (currentUrl.endsWith('/login')) {
      return;
    }

    this.returnUrl = currentUrl;
    console.log('xxx', redminePluginUrl('/login'))
    this.push(redminePluginUrl('/login'));
  }

  public toReturnUrl() {
    this.pusher(this.returnUrl || redminePluginUrl('/'));
    this.returnUrl = '';
  }

  toChangePassword() {
    this.returnUrl = this.getCurrent();
    this.push(redminePluginUrl('/change-password'));
  }

  public registerOnNavigationLinksChange(onNavigationLinksChange: (value: NavigationLink[]) => void) {
    this.onNavigationLinksChange = onNavigationLinksChange;
  }

  public removeOnNavigationLinksChange() {
    this.onNavigationLinksChange = null;
  }

  public set navigationLinks(value: NavigationLink[]) {
    this._navigationLinks = value;
    setTimeout(() => {
      this.onNavigationLinksChange && this.onNavigationLinksChange(value);
    }, 1);
  }

  public get navigationLinks() {
    return this._navigationLinks;
  }
}

export const routerControl = new RouterControl();
