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
  private city;

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
    this.city = this.navParams.get('city');    
    
    if (this.project.picture)
      this.picture = this.project.picture;
  }

  openFB() {
    this.api.openFacebookPage();    
  }

  back() {
    this.navCtrl.pop();
  }

  async like() {
    if (this.project.vote) return;
    try {
      let result = await this.api.likeProject(this.city.id, this.project.id)
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