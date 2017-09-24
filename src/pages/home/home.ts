import { TranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { NavController, IonicPage } from 'ionic-angular';
import { InAppBrowser, InAppBrowserObject, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { ApiProvider } from '../../providers/api';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [
    ApiProvider,
    InAppBrowser
  ]
})
export class HomePage {
  private projects;
  private isLoading;
  private isLoadingOnPull;

  private options: InAppBrowserOptions = {
    location: 'no', // addressbar
    hardwareback: 'yes',
    useWideViewPort: 'yes',
    toolbar: 'no',
    zoom: 'no',
    presentationstyle: 'pagesheet'
  };

  constructor(
    public navCtrl: NavController,
    private iab: InAppBrowser,
    public api: ApiProvider,
    public translate: TranslateService,
  ) {
    this.projects = [];
    this.isLoading = false;
    this.isLoadingOnPull = false;
  }

  ngAfterViewInit() {
    this.refresh();
  }

  async pullRefresh(event) {
    try {
      this.isLoadingOnPull = true;
      await this.refresh()
    } finally {
      event.complete();
      this.isLoadingOnPull = false;
    }
  }

  async refresh() {
    try {
      this.isLoading = true;
      let json = await this.api.getProjects();
      this.projects = json.projects;
    } catch(err) {
      console.log(err);
    } finally {
      this.isLoading = false;
    }
  }

  async bankIdLogin() {
    await this.api.initSettings();

    let browser: InAppBrowserObject = this.iab.create(
      this.api.getBaseAuthURL(),
      "_self",
      this.options
    );

    browser.on("loadstart").subscribe(event => {
      console.log(event);
      if ((event.url).indexOf(this.api.codeURL) === 0) {
        this.api.setCode(event.url);
        browser.close();
      }
    });

    browser.on("loadstop").subscribe(event => {
      console.log(event);
      this.api.getTransformCSS()
        .then(css => {
          browser.insertCSS({ code: css });
        })
        .catch(err => console.log(err));
    });

    browser.show();
  }

  openDetails(p) {
    this.navCtrl.push('DetailsPage', { project: p })
  }

  openFB() {
    let browser: InAppBrowserObject = this.iab.create(
      "https://fb.me",
      "_self",
      this.options
    );
    browser.show();
  }
}
