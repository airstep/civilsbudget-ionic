import { Platform } from 'ionic-angular'
import { TranslateService } from '@ngx-translate/core'
import { ToastService } from './toast'
import { Injectable } from '@angular/core'
import { Http, Response, RequestOptions, Headers } from '@angular/http'
import { InAppBrowser, InAppBrowserObject, InAppBrowserOptions } from '@ionic-native/in-app-browser'
import { Storage } from '@ionic/storage'

import { Observable } from 'rxjs/Observable'

import 'rxjs/add/operator/catch'
import 'rxjs/add/observable/throw'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/toPromise'
import 'rxjs/add/operator/timeout'

@Injectable()
export class ApiProvider {
  public baseAuthURL = "https://bankid.privatbank.ua/DataAccessService"
  // private baseDataURL = "https://bankid.privatbank.ua/ResourceService"

  // REAL URL's
  private baseURL = "https://golos.hromada.live/api"
  public codeURL = `${this.baseURL}/login?code=`
  // UNCOMMENT

  // !!! FOR TEST ONLY !!!
  //private baseURL = "https://test.vote.imisto.com.ua/api"
  //public codeURL = "https://test.vote.imisto.com.ua/api/login?code="
  // !!! COMMENT THIS AFTER TEST END !!!

  public code = ""

  public user: any
  public bankIdAuth: any

  private timeoutMS = 20000

  private settings

  private options: InAppBrowserOptions = {
    location: 'no', // addressbar
    hardwareback: 'yes',
    useWideViewPort: 'yes',
    enableViewportScale: 'yes',
    toolbar: 'no',
    zoom: 'no',
    presentationstyle: 'fullscreen',
    clearsessioncache: 'yes',
    clearcache: 'yes',
    footer: 'yes' // set to yes to show a close button in the footer similar to the iOS Done button.
  };

  constructor(
    public http: Http,
    private iab: InAppBrowser,
    private translate: TranslateService,
    private platform: Platform,
    private storage: Storage,
    private toast: ToastService
  ) {
  }

  async initUserFromSettings() {
    try {
      await this.platform.ready()
      let result = await this.storage.get('user')
      if (result && this.isJsonString(result)) {
        let savedUser = JSON.parse(result)
        if (this.checkUserTime(savedUser))
          this.user = savedUser;
      }
    } catch (err) {
      console.log(err)
    }
  }

  private checkUserTime(user) {
    if (user.savedAt) {
      var diffOneHour = 60 * 60 * 1000;
      var currentDate = new Date().getTime();
      var userDate = Date.parse(user.savedAt)
      var result = ((currentDate - userDate) < diffOneHour)
      console.log("check if user time go away: " + result)
      return result
    }
    return false    
  }

  public async initSettings() {
    this.settings = await this.get("/settings")
  }

  public getBrowserOptions() {
    return this.options
  }

  public async getProjects(votingId) {
    return this.get("/votings/"+ votingId + "/projects")
  }

  public async isAuthorized(): Promise<boolean> {
    if (this.user) {
      return true
    } else {
      await this.initUserFromSettings()
    }
    return this.user !== undefined
  }

  public async auth() {
    return this.http.get(this.baseAuthURL + "/das/authorize?response_type=code&client_id=" + this.settings.bi_client_id + "&redirect_uri" + this.settings.bi_redirect_uri)
      .map(res => {
        console.log(res.text())
        res.text()
      })
      .catch(this.catchError)
      .toPromise()
  }

  public async civilAuth() {
    this.user = await this.get("/authorization?code=" + this.bankIdAuth.access_token)
    if (this.user && this.storage) {
      this.user.savedAt = new Date();
      this.storage.set('user', JSON.stringify(this.user))
    }
  }

  public async getProject(votingId, id) {
    await this.checkAuth()

    if (await this.isAuthorized()) {
      return this.get("/votings/" + votingId + "/projects/" + id)
    } else {
      this.toast.show(this.translate.instant('PLEASE_AUTHORIZE'))
    }
  }

  public async checkAuth() {
    let authState: boolean = await this.isAuthorized()
    if (!authState) {
      if (!this.code) {
        let result = await this.bankIdLogin()
        if (!result) return // skip cancel
      }
      await this.civilAuth()
    }
  }

  public async voteProject(cityId, projectId) {
    await this.checkAuth()

    if (await this.isAuthorized()) {
      let headers = new Headers({
        'Accept': 'application/json',
        'Content-Type' : 'application/json'
      })
      let options = new RequestOptions({ headers: headers })
      let data = JSON.stringify({
        //clid: this.user.clid
      })
      return this.http.post(this.baseURL + "/votings/" + cityId + "/projects/" + projectId + "/vote", data, options)
        .map(res => {
          console.log(res)
          return res.json()
        })
        .catch(this.catchError)
        .toPromise()
    } else {
      this.toast.show(this.translate.instant('PLEASE_AUTHORIZE'))
    }
  }

  public getVotings() {
    return this.get("/votings")
  }

  public async get(path) {
    return this.http.get(this.baseURL + path)
    .timeout(this.timeoutMS)
    .map(res => {
      console.log(res)
      let result = res.json()
      return result
    })
    .catch(this.catchError)
    .toPromise()
  }

  public async getTransformCSS() {
    return this.http.get('assets/css/style.css')
      .map(css => css.text())
			.catch(this.catchError)
      .toPromise()
  }

  getBaseAuthURL() {
    return this.settings.bi_auth_url +
      "/DataAccessService/das/authorize?response_type=code" +
      "&client_id=" + this.settings.bi_client_id +
      "&redirect_uri=" + this.settings.bi_redirect_uri
  }

  setCode(url) {
    this.code = url.substr(url.lastIndexOf("=") + 1, url.length)
  }

  catchError(error: Response | any){
    let errMsg: string
    let result: Error
    if (error instanceof Response) {
      let err = ''
      if (error.text() && error.text().indexOf('<html') === -1) {
        const body = error.json() || ''
        err = body.error || JSON.stringify(body)
        if (body) result = body;
      } else {
        //err = error.text()
      }
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`
    } else {
      errMsg = error.message ? error.message : error.toString()
    }
    console.error(errMsg)
    return Observable.throw(result ? result : errMsg)
  }

  isJsonString(str) {
    try {
      JSON.parse(str)
    } catch (e) {
      return false
    }
    return true
  }

  // Auth
  async bankIdLogin() {
    await this.initSettings()

    let baseAuthURL = this.getBaseAuthURL()

    this.options.closebuttoncaption = 'Зачинити';
    this.options.toolbarposition = 'bottom';
    this.options.toolbar = 'yes';
    this.options.clearcache = 'yes';
    this.options.clearsessioncache = 'yes';
    this.options.fullscreen = 'yes';
    return new Promise((resolve, reject) => {
      const browser: InAppBrowserObject = this.iab.create(
        baseAuthURL,
        '_blank',
        this.options
      );

      browser.on("loadstart").subscribe(event => {
        console.log(event)
        if ((event.url).indexOf('login?code=') != -1) {
          this.setCode(event.url)
          browser.hide()
        }
      })

      browser.on("exit").subscribe(event => {
        console.log(event)
        if (this.bankIdAuth) {
          resolve(true)
        } else {
          resolve(false)
        }
      })

      browser.on("loaderror").subscribe(event => {
        console.log(event)
        reject(event)
      })

      browser.on("loadstop").subscribe(event => {
        console.log('on loadstop')
        console.dir(event)
        if (event.url.startsWith(this.codeURL)) {
          browser.executeScript({ code: "document.body.innerText" })
            .then(result => {
                console.log(result)
                if (result.length > 0) {
                  this.bankIdAuth = JSON.parse(result[0])
                  browser.close()
                }
            })
            .catch(err => {
              browser.close()
              console.log(err)
              reject(err)
            })
        } else if (event.url.indexOf("DataAccessService") !== -1) {
          this.getTransformCSS()
            .then(css => {
              browser.insertCSS({ code: css })
            })
            .catch(err => console.log(err))
        }
      })

      browser.show()
    })
  }

  openFacebookPage() {
    let browser: InAppBrowserObject = this.iab.create(
      this.translate.instant('FB_URL'),
      "_self",
      this.getBrowserOptions()
    )
    browser.show()
  }
}
