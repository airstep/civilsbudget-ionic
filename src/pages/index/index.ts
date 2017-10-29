import { Component } from '@angular/core'
import { IonicPage, NavController } from 'ionic-angular'

import { ToastService } from './../../providers/toast'
import { ApiProvider } from '../../providers/api'
import { InAppBrowser } from '@ionic-native/in-app-browser'

import { NetworkService } from './../../providers/network';

@IonicPage()
@Component({
  selector: 'page-index',
  templateUrl: 'index.html',
  providers: [
    ApiProvider,
    ToastService,
    InAppBrowser,
    NetworkService
  ]
})
export class IndexPage {

  private places

  constructor(
    private api: ApiProvider,
    public network: NetworkService,
    public navCtrl: NavController
  ) {
    this.places = []
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad IndexPage')
    this.initPlaces()
  }

  async initPlaces() {
    let result = await this.api.getVotings()
    this.places = result.votings
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
