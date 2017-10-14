import { TranslateService } from '@ngx-translate/core';
import { ToastService } from './toast';
import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { InAppBrowser, InAppBrowserObject, InAppBrowserOptions } from '@ionic-native/in-app-browser'

import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class ApiProvider {
  public baseAuthURL = "https://bankid.privatbank.ua/DataAccessService";
  private baseDataURL = "https://bankid.privatbank.ua/ResourceService";

  private baseURL = "https://vote.imisto.com.ua/api";

  //private baseURL = "http://test.vote.imisto.com.ua/api";

  public codeURL = "https://vote.imisto.com.ua/api/login?code=";

  public code = "";
  
  public user: any;
  public bankIdAuth: any;

  private clid = "";

  private timeoutMS = 10000;

  private settings;

  private options: InAppBrowserOptions = {
    location: 'no', // addressbar
    hardwareback: 'yes',
    useWideViewPort: 'yes',
    enableViewportScale: 'yes',
    toolbar: 'no',
    zoom: 'no',
    presentationstyle: 'pagesheet'
  }

  constructor(
    public http: Http, 
    private iab: InAppBrowser,
    private translate: TranslateService,
    private toast: ToastService
  ) { 

  }

  public async initSettings() {
    this.settings = await this.get("/settings")
  }

  public getBrowserOptions() {
    return this.options;
  }

  public async getProjects() {
    return this.get("/projects")
  }

  public isAuthorized(): boolean {
    return this.user !== undefined;
  }

  public async auth() {
    return this.http.get(this.baseAuthURL + "/das/authorize?response_type=code&client_id=" + this.settings.bi_client_id + "&redirect_uri" + this.settings.bi_redirect_uri)
      .map(res => {
        console.log(res.text())
        res.text()
      })
      .catch(this.catchError)
      .toPromise();
  }

  public async civilAuth() {
    this.user = await this.get("/authorization?code=" + this.bankIdAuth.access_token)
  }
  
  public async getProject(id) {
    return this.get("/projects/" + id)
  }

  public async likeProject(id) {
    if (!this.code) {
      let result = await this.bankIdLogin()
      if (!result) return // skip cancel
    }
  
    if (!this.isAuthorized())
      await this.civilAuth();

    if (this.isAuthorized()) {
      return this.http.post(this.baseURL + "/projects/" + id + "/like", { clid: this.user.clid })
        .map(res => res.json())
        .catch(this.catchError)
        .toPromise();
    } else {
      this.toast.show(this.translate.instant('PLEASE_AUTHORIZE'));      
    }
  }

  public async get(path) {
    return this.http.get(this.baseURL + path)
    .timeout(this.timeoutMS)
    .map(res => {
      let result = res.json()
      console.log(result)
      return result
    })
    .catch(this.catchError)
    .toPromise();
  }

  public async getTransformCSS() {
    return this.http.get('assets/css/style.css')
      .map(css => css.text())
			.catch(this.catchError)
      .toPromise();
  }

  getBaseAuthURL() {
    return this.settings.bi_auth_url +
      "/DataAccessService/das/authorize?response_type=code" +
      "&client_id=" + this.settings.bi_client_id +
      "&redirect_uri=" + this.settings.bi_redirect_uri;
  }

  setCode(url) {
    this.code = url.substr(url.lastIndexOf("=") + 1, url.length);
  }

  catchError(error: Response | any){
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }
  
  // Auth

  async bankIdLogin() {
    await this.initSettings()

    let baseAuthURL = this.getBaseAuthURL();
    
    return new Promise((resolve, reject) => {
      let browser: InAppBrowserObject = this.iab.create(
        baseAuthURL,
        "_self",
        this.options
      )

      browser.on("loadstart").subscribe(event => {
        console.log(event)
        if ((event.url).indexOf('login?code=') != -1) {
          this.setCode(event.url)
          browser.hide()
        }
      })

      browser.on("exit").subscribe(event => {
        console.log(event);
        if (this.bankIdAuth) {
          resolve(true)
        } else {
          resolve(false)
        }
      });
      
      browser.on("loaderror").subscribe(event => {
        console.log(event);
        reject(event)
      });

      browser.on("loadstop").subscribe(event => {
        console.log(event)
        if (event.url.startsWith(this.codeURL)) {
          browser.executeScript({ code: "document.body.innerText" })
            .then(result => {
                console.log(result);              
                if (result.length > 0) {
                  this.bankIdAuth = JSON.parse(result[0]);
                  browser.close();
                }
            })
            .catch(err => {
              browser.close();
              console.log(err)
              reject(err)
            });
        } else if (event.url.indexOf("DataAccessService") !== -1) {
          this.getTransformCSS()
            .then(css => {
              browser.insertCSS({ code: css })
            })
            .catch(err => console.log(err))
        }
      })

      browser.show()
    });
  }
}
