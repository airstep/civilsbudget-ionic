import { ToastService } from './../../providers/toast'
import { TranslateService } from '@ngx-translate/core'
import { Component, ViewChild, NgZone, OnDestroy } from '@angular/core'
import { NavController, IonicPage, Alert, NavParams, Content } from 'ionic-angular'
import { InAppBrowser } from '@ionic-native/in-app-browser'

import { ApiProvider } from '../../providers/api'

import 'rxjs/add/operator/map'
import 'rxjs/add/operator/timeout'
import { NetworkService } from '../../providers/network';
import { FirebaseAnalytics } from '@ionic-native/firebase-analytics';
import { Events, ScrollEvent } from 'ionic-angular';
import { Subscription } from 'rxjs'

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
export class HomePage implements OnDestroy {
  
  @ViewChild(Content) content: Content;

  private DEFAULT_PROJECT_COUNT = 5

  private projects
  private allProjects
  
  private isAuth: boolean
  private isLoading: boolean
  private isLoadingOnPull: boolean
  private isFooterVisible: boolean
  
  private alert: Alert
  private city

  authCheckSub: Subscription
  
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public api: ApiProvider,
    public translate: TranslateService,
    public toast: ToastService,
    public events: Events,
    public network: NetworkService,
    public zone: NgZone,
    private firebaseAnalytics: FirebaseAnalytics
  ) {
    this.projects = []
    this.allProjects = []
    this.isLoading = false
    this.isLoadingOnPull = false
    this.isFooterVisible = true
    this.city = this.navParams.get('city')
  }

  ngAfterViewInit() {
    this.initEvents()
    this.refresh()
    this.firebaseAnalytics.logEvent('page_view', {page: "projects"})
      .then((res: any) => console.log(res))
      .catch((error: any) => console.error(error));    
  }

  initEvents() {
    this.events.subscribe('refresh', () => {
      this.refresh();
    });

    this.events.subscribe('auth:success', () => {
      this.isAuth = true
    });

    this.authCheckSub = this.api.authCheck.subscribe((user) => {
      this.isAuth = user ? true : false
      console.log('on check:auth', this.isAuth)
    });

    this.api.isAuthorized();

    this.content.ionScrollEnd.subscribe(this.toggleFooter.bind(this))
  }

  ngOnDestroy() {
    this.events.unsubscribe('refresh')
    this.events.unsubscribe('auth:success')
    if (this.authCheckSub) {
      this.authCheckSub.unsubscribe()
    }
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

  logout() {
    this.toast.showConfirmAlert("Ви бажаєте вийти?", () => {
      this.api.logout()
      this.selectCity()
    })
  }

  info() {
    if (this.api.user['full_name']) {
      this.toast.showAlert(`Ви зайшли як: ${this.api.user.full_name}`)
    }
  }

  async refresh() {
    try {
      this.isLoading = true
      let json = await this.api.getProjects(this.city.id)
      console.log(json)
      this.allProjects = json.projects
      
      this.api.isAuthorized();
      
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
      
      if (isWasAuth) {
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
      } else {
        await this.api.checkAuth()
      }
    } catch(err) {
      console.log('error on vote')
      console.dir(err)
      if (err.danger)
        this.alert = this.toast.showAlert(err.danger)    
      else if (err.warning) {
        this.alert = this.toast.showAlert(err.warning)
        if (!isWasAuth && await this.api.isAuthorized()) {
          this.refresh()
        }
      } else {
        this.toast.showError(JSON.parse(err))
      }
    }
  }

  selectCity() {
    this.navCtrl.setRoot('IndexPage')
  }
}