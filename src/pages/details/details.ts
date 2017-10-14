import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Alert } from 'ionic-angular';
import { InAppBrowser, InAppBrowserObject } from '@ionic-native/in-app-browser'

import { ApiProvider } from '../../providers/api'
import { ToastService } from './../../providers/toast';
import { TranslateService } from '@ngx-translate/core'

@IonicPage()
@Component({
  selector: 'page-details',
  templateUrl: 'details.html',
  providers: [
    ApiProvider,
    InAppBrowser,
    ToastService
  ]  
})
export class DetailsPage {

  private project;
  private alert: Alert
  
  private picture: string = 'assets/img/header.png';

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public api: ApiProvider,
    public translate: TranslateService,
    public toast: ToastService,
    private iab: InAppBrowser    
  ) {
    this.project = this.navParams.get('project');    
    if (this.project.picture)
      this.picture = this.project.picture;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DetailsPage');
  }

  openFB() {
    let browser: InAppBrowserObject = this.iab.create(
      "https://fb.me",
      "_self",
      this.api.getBrowserOptions()
    )
    browser.show()    
  }

  back() {
    this.navCtrl.pop();
  }

  async like() {
    if (this.project.vote) return;
    try {
      let result = await this.api.likeProject(this.project.id)
      if (result) {
        if (result.danger) {
          this.alert = this.toast.showAlert(result.danger);
        } else {
          if (result.voted_project) {
            this.project.likes_count++;
            this.project.vote = true;
          }
        }
      }
    } catch(err) {
      console.log(err);
      this.toast.showError(err);
    }
  }  
}