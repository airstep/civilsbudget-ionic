import { Component } from '@angular/core'
import { IonicPage, NavController } from 'ionic-angular'

import { ToastService } from './../../providers/toast'
import { ApiProvider } from '../../providers/api'
import { InAppBrowser } from '@ionic-native/in-app-browser'

import { NetworkService } from './../../providers/network'
import { TranslateService } from '@ngx-translate/core'

@IonicPage()
@Component({
  selector: 'page-index',
  templateUrl: 'index.html',
  providers: [
    ApiProvider,
    ToastService,
    InAppBrowser,
    NetworkService,
    ToastService
  ]
})
export class IndexPage {

  private places
  private firstInit: boolean
  private isLoading: boolean

  constructor(
    private api: ApiProvider,
    public network: NetworkService,
    public navCtrl: NavController,
    public translate: TranslateService,
    public toast: ToastService
  ) {
    this.places = []
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad IndexPage')
    this.initPlaces()
  }

  async initPlaces() {
    try {
      this.isLoading = true;
      let result = await this.api.getVotings()
      this.places = result.votings
    } catch(err) {
      console.log(err)
      if (err.message)
        this.toast.show(err.message)
    } finally {
      this.isLoading = false;
    }
    this.firstInit = true
    console.log(this.places)
  }

  retry() {
    if (this.network.isOnline())
      this.initPlaces()
  }

  openCity(city) {
    this.navCtrl.push('HomePage', {city: city})
  }
}
