import { ToastService } from './../../providers/toast'
import { TranslateService } from '@ngx-translate/core'
import { Component, ViewChild, NgZone } from '@angular/core'
import { NavController, IonicPage, Alert, NavParams, Content } from 'ionic-angular'
import { InAppBrowser, InAppBrowserObject } from '@ionic-native/in-app-browser'
import { Storage } from '@ionic/storage'

import { ApiProvider } from '../../providers/api'

import 'rxjs/add/operator/map'
import 'rxjs/add/operator/timeout'
import { NetworkService } from '../../providers/network';
import { FirebaseAnalytics } from '@ionic-native/firebase-analytics';
import { Events, ScrollEvent } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [
    ApiProvider,
    InAppBrowser,
    ToastService,
    NetworkService,
    FirebaseAnalytics
  ]
})
export class HomePage {
  
  @ViewChild(Content) content: Content;

  private DEFAULT_PROJECT_COUNT = 5

  private projects
  private allProjects
  
  private isLoading: boolean
  private isLoadingOnPull: boolean
  private isFooterVisible: boolean
  
  private alert: Alert
  private city

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public api: ApiProvider,
    public translate: TranslateService,
    public toast: ToastService,
    public events: Events,
    public network: NetworkService,
    public zone: NgZone,
    private firebaseAnalytics: FirebaseAnalytics,
    private iab: InAppBrowser
  ) {
    this.projects = []
    this.allProjects = []
    this.isLoading = false
    this.isLoadingOnPull = false
    this.isFooterVisible = true
    this.city = this.navParams.get('city')
  }

  ngAfterViewInit() {
    this.refresh()
    this.initEvents()
    this.firebaseAnalytics.logEvent('page_view', {page: "projects"})
      .then((res: any) => console.log(res))
      .catch((error: any) => console.error(error));    
  }

  initEvents() {
    this.events.subscribe('refresh', () => {
      this.refresh();
    });

    this.content.ionScrollEnd.subscribe(this.toggleFooter.bind(this))
  }

  toggleFooter(e: ScrollEvent) {
    if (e.directionY) {
      this.zone.run(() =>{
        this.isFooterVisible = (e.directionY === "up")
      })
    }
  }

  async pullRefresh(event) {
    try {
      this.isLoadingOnPull = true
      await this.refresh()
    } finally {
      event.complete()
      this.isLoadingOnPull = false
    }
  }

  async refresh() {
    try {
      this.isLoading = true
      let json = await this.api.getProjects(this.city.id)
      console.log(json)
      this.allProjects = json.projects
      
      this.projects = []
      for (let i = 0; i < this.DEFAULT_PROJECT_COUNT; i++) {
        this.projects.push(this.allProjects[i])
      }

    } catch(err) {
      console.log(err)
      this.toast.showError(err)
    } finally {
      this.isLoading = false
    }
  }

  doInfinite(infiniteScroll) {
    console.log('Begin async operation')
    if (this.projects && this.allProjects) {
      if (this.projects.length < this.allProjects.length) {
        let offset = this.projects.length + 1
        for (let i = offset; i < offset + this.DEFAULT_PROJECT_COUNT; i++) {
          if (i < this.allProjects.length)
            this.projects.push(this.allProjects[i])
          else break
        }
      }
    }
    console.log('Async operation has ended')
    infiniteScroll.complete()
  }
  
  openDetails(p) {
    this.navCtrl.push('DetailsPage', { city: this.city, project: p })
  }

  openFB() {
    this.api.openFacebookPage()
  }

  async vote(project) {
    let isWasAuth = false;
    try {
      if (this.network.isOffline()) {
        this.alert = this.toast.showAlert(this.translate.instant('CONN_PROBLEM_OFFLINE'))
        return
      }
      if (project.is_voted) {
        this.alert = this.toast.showAlert(this.translate.instant('WARN_ALREADY_VOTED'))
        return
      }        
      
      this.firebaseAnalytics.logEvent('vote', {page: "projects", status: 'try', projectId: project.id, cityId: this.city.id})
        .then((res: any) => console.log(res))
        .catch((error: any) => console.error(error));

      isWasAuth = await this.api.isAuthorized()

      let result = await this.api.voteProject(this.city.id, project.id)
      if (result) {
        if (result.danger) {
          this.alert = this.toast.showAlert(result.danger)
        } else if (result.warning) {
          this.alert = this.toast.showAlert(result.warning)
        } else if (result.success) {
          project.voted++
          project.is_voted = true
          this.alert = this.toast.showAlert(result.success)
          this.firebaseAnalytics.logEvent('voted', {page: "projects", status: 'success', projectId: project.id, cityId: this.city.id})
            .then((res: any) => console.log(res))
            .catch((error: any) => console.error(error));            
        }
      }
    } catch(err) {
      console.log(err)
      if (err.danger)
        this.alert = this.toast.showAlert(err.danger)    
      else if (err.warning) {
        this.alert = this.toast.showAlert(err.warning)
        if (!isWasAuth && this.api.isAuthorized()) 
          this.refresh()
      } else
        this.toast.showError(JSON.stringify(err))
    }
  }

  selectCity() {
    this.navCtrl.setRoot('IndexPage')
  }
}