import { Platform } from 'ionic-angular'
import { TranslateService } from '@ngx-translate/core'
import { ToastService } from './toast'
import { Injectable } from '@angular/core'
import { Http, Response, RequestOptions, Headers, ResponseContentType } from '@angular/http'
import { InAppBrowser, InAppBrowserObject, InAppBrowserOptions } from '@ionic-native/in-app-browser'

import { Observable } from 'rxjs/Observable'

import 'rxjs/add/operator/catch'
import 'rxjs/add/observable/throw'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/toPromise'
import 'rxjs/add/operator/timeout'
import { Subject } from 'rxjs'

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

  // public code = ""

  public user: any
  public bankIdAuth: any

  private timeoutMS = 40000

  private settings
  public authCheck: Subject<any> = new Subject();

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
    private toast: ToastService
  ) {
  }

  async initUserFromSettings() {
    console.log('initUserFromSettings')
    try {
      await this.platform.ready()
      let result = localStorage.getItem('user')
      if (result && this.isJsonString(result)) {
        let savedUser = JSON.parse(result)
        if (this.checkUserTime(savedUser)) {
          this.user = savedUser;
          this.authCheck.next(this.user)
        }
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

  public async logout() {
    // this.code = ""
    this.bankIdAuth = undefined
    this.user = undefined
    localStorage.clear()
    this.authCheck.next(this.user)
  }

  public async isAuthorized(): Promise<boolean> {
    if (this.user) {
      this.authCheck.next(this.user)
      return true
    } else {
      await this.initUserFromSettings()
    }
    console.log('isAuthorized', this.user !== undefined)
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
    console.log('civilAuth') 
    try {
      if (this.bankIdAuth) {
        console.log('civilAuth1') 
        this.user = await this.get("/authorization?code=" + this.bankIdAuth.access_token)
        console.log('user', JSON.stringify(this.user))
        if (this.user) {
          console.log('civilAuth2') 
          this.user.savedAt = new Date();
          localStorage.setItem('user', JSON.stringify(this.user))
          console.log('civilAuth3') 
          this.authCheck.next(this.user)
        }
        console.log('civilAuth4') 
        return true
      }
    } catch (err) {
      console.log('civilAuth err')
      console.dir(err)
    }
    return false
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
      return await this.bankIdLogin()
      // if (this.bankIdAuth && this.bankIdAuth.access_token)
      //   await this.civilAuth()
    }
    return false;
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
    console.log(this.baseURL + path)
    return this.http.get(this.baseURL + path, {responseType: ResponseContentType.Json})
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

  // setCode(url) {
  //   this.code = url.substr(url.lastIndexOf("=") + 1, url.length)
  // }

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
    await this.platform.ready()
    
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

      // browser.on("loadstart").subscribe(event => {
      //   console.log(event)
      //   if ((event.url).indexOf('login?code=') != -1) {
      //     this.setCode(event.url)
      //     browser.hide()
      //   }
      // })

      browser.on("exit").subscribe(event => {
        console.log(event)
        console.log('exit', JSON.stringify(this.bankIdAuth))
        if (this.bankIdAuth) {
          this.civilAuth().then(() => resolve(true))
            .catch(err => reject(false))
        } else {
          resolve(false)
        }
      })

      browser.on("loaderror").subscribe(event => {
        console.log(event)
        reject(event)
      })

      browser.on('customscheme').subscribe(event => {
        //do whatever you want here like:
        console.log('customscheme')
        let ref = window.open(event.url, "_system");
        ref.addEventListener('loadstop', (event: any) => {
          console.log('window on loadstop')
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
          }
        })
      });

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
        }
      })

      browser.show()
    })
  }

  openFacebookPage() {
    let browser: InAppBrowserObject = this.iab.create(
      this.translate.instant('FB_URL'),
      "_system",
      this.getBrowserOptions()
    )
    browser.show()
  }
}
