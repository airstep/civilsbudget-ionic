import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class ApiProvider {
  public baseAuthURLString = "https://bankid.privatbank.ua/DataAccessService";
  //private baseDataURLString = "https://bankid.privatbank.ua/ResourceService";

  //private baseURL = "https://vote.imisto.com.ua/api";

  private baseURL = "http://test.vote.imisto.com.ua/api";

  public codeURL = "https://vote.imisto.com.ua/api/login?code=";

  public code = "";

  private timeoutMS = 10000;

  private settings;

  constructor(public http: Http) { }

  public async initSettings() {
    this.settings = await this.get("/settings")
  }

  public async getProjects() {
    return this.get("/projects")
  }

  public async getProject(id) {
    return this.get("/projects/" + id)
  }

  public async likeProject(id) {
    return this.http.post("/projects/" + id + "/like", '')
      .map(res => res.json())
      .catch(this.catchError)
      .toPromise();
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
    return this.baseAuthURLString +
      "/das/authorize?response_type=code" +
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
}
