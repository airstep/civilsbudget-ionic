import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { ToastService } from './../../providers/toast';
import { ApiProvider } from '../../providers/api'
import { InAppBrowser } from '@ionic-native/in-app-browser';

@IonicPage()
@Component({
  selector: 'page-index',
  templateUrl: 'index.html',
  providers: [
    ApiProvider,
    InAppBrowser,
    ToastService
  ]
})
export class IndexPage {

  private places

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private api: ApiProvider
  ) {
    this.places = [];
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad IndexPage');
    this.initPlaces()
  }

  async initPlaces() {
    let result = await this.api.getVotings();
    this.places = result.votings;
    console.log(this.places);
  }

  openCity(city) {
    this.navCtrl.push('HomePage', {city: city})
  }
}
