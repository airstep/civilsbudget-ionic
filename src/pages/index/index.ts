import { Component } from '@angular/core'
import { IonicPage, NavController, LoadingController, Loading } from 'ionic-angular'

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
  private loader: Loading

  constructor(
    private api: ApiProvider,
    public network: NetworkService,
    public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public translate: TranslateService,
    public toast: ToastService
  ) {
    this.places = []
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad IndexPage')
    this.initPlaces()
  }

  ionViewDidLeave(){
   if (this.loader)
    this.loader.dismiss()
  }

  showLoader() {
    let loadingMessage = this.translate.instant('LOADING')
    this.loader = this.loadingCtrl.create({
      content: loadingMessage
    })
    this.loader.present()    
  }

  async initPlaces() {
    this.showLoader()
    try {
      let result = await this.api.getVotings()
      this.places = result.votings
    } catch(err) {
      console.log(err)
      if (err.message)
        this.toast.show(err.message)
    } finally {
      this.loader.dismiss()
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
