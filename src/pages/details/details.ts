import { Component } from '@angular/core'
import { IonicPage, NavController, NavParams, Alert } from 'ionic-angular'
import { InAppBrowser, InAppBrowserObject } from '@ionic-native/in-app-browser'

import { ApiProvider } from '../../providers/api'
import { ToastService } from './../../providers/toast'
import { TranslateService } from '@ngx-translate/core'
import { NetworkService } from '../../providers/network';

@IonicPage()
@Component({
  selector: 'page-details',
  templateUrl: 'details.html',
  providers: [
    ApiProvider,
    InAppBrowser,
    ToastService,
    NetworkService
  ]  
})
export class DetailsPage {

  private project
  private alert: Alert
  private city

  private picture: string = 'assets/img/header.png'

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public api: ApiProvider,
    public translate: TranslateService,
    public toast: ToastService,
    public network: NetworkService,
    private iab: InAppBrowser    
  ) {
    this.project = this.navParams.get('project')    
    this.city = this.navParams.get('city')    
    
    if (this.project.picture)
      this.picture = this.project.picture
  }

  openFB() {
    this.api.openFacebookPage()    
  }

  back() {
    this.navCtrl.pop()
  }

  async vote() {
    if (this.network.isOffline()) {
      this.alert = this.toast.showAlert(this.translate.instant('CONN_PROBLEM_OFFLINE'))
      return
    }  
    if (this.project.is_voted) {
      this.alert = this.toast.showAlert(this.translate.instant('WARN_ALREADY_VOTED'))
      return
    }
    try {
      let result = await this.api.voteProject(this.city.id, this.project.id)
      if (result) {
        if (result.danger) {
          this.alert = this.toast.showAlert(result.danger)
        } else if (result.warning) {
          this.alert = this.toast.showAlert(result.warning)
          this.project.voted++
          this.project.is_voted = true          
        } else if (result.success) {
          this.project.voted++
          this.project.is_voted = true
          this.alert = this.toast.showAlert(this.translate.instant('THANKS_BY_VOTE'))
        }
     }
    } catch(err) {
      console.log(err)
      if (err.danger)
        this.alert = this.toast.showAlert(err.danger)    
      else if (err.warning)
        this.alert = this.toast.showAlert(err.warning)
      else
        this.toast.showError(err)
    }
  }  
}