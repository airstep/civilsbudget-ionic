import { ToastService } from './../../providers/toast';
import { TranslateService } from '@ngx-translate/core'
import { Component } from '@angular/core'
import { NavController, IonicPage, Alert, LoadingController } from 'ionic-angular'
import { InAppBrowser, InAppBrowserObject } from '@ionic-native/in-app-browser'

import { ApiProvider } from '../../providers/api'

import 'rxjs/add/operator/map'
import 'rxjs/add/operator/timeout'

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [
    ApiProvider,
    InAppBrowser,
    ToastService
  ]
})
export class HomePage {
  private DEFAULT_PROJECT_COUNT = 5;

  private projects
  private allProjects
  
  private isLoading: boolean
  private isLoadingOnPull: boolean
  
  private alert: Alert
  private loader

  constructor(
    public navCtrl: NavController,
    public api: ApiProvider,
    public translate: TranslateService,
    public toast: ToastService,
    public loadingCtrl: LoadingController,
    private iab: InAppBrowser
  ) {
    this.projects = []
    this.isLoading = false
    this.isLoadingOnPull = false
  }

  ngAfterViewInit() {
    this.refresh()
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
      let json = await this.api.getProjects()
      this.allProjects = json.projects
      
      this.projects = [];
      for (let i = 0; i < this.DEFAULT_PROJECT_COUNT; i++) {
        this.projects.push(this.allProjects[i]);
      }

    } catch(err) {
      console.log(err)
      this.toast.showError(err);
    } finally {
      this.isLoading = false
    }
  }

  doInfinite(infiniteScroll) {
    console.log('Begin async operation');
    if (this.projects.length < this.allProjects.length) {
      let offset = this.projects.length + 1;
      for (let i = offset; i < offset + this.DEFAULT_PROJECT_COUNT; i++) {
        if (i < this.allProjects.length)
          this.projects.push(this.allProjects[i]);
        else break;
      }
    }
    console.log('Async operation has ended');
    infiniteScroll.complete();
  }

  initLoader() {
    let loadingMessage = this.translate.instant('LOADING')
    this.loader = this.loadingCtrl.create({
      content: loadingMessage
    });    
  }
  
  openDetails(p) {
    if (!this.loader) 
      this.initLoader();
    this.loader.present();
    this.navCtrl.push('DetailsPage', { project: p })
  }

  ionViewDidLeave(){
    if (this.loader)
      this.loader.dismiss();
  }

  openFB() {
    let browser: InAppBrowserObject = this.iab.create(
      "https://fb.me",
      "_self",
      this.api.getBrowserOptions()
    )
    browser.show()
  }

  async like(project) {
    try {
      let result = await this.api.likeProject(project.id)
      if (result) {
        if (result.danger) {
          this.alert = this.toast.showAlert(result.danger);
        } else {
          if (result.voted_project) {
            project.likes_count++;
            project.vote = true;
          }
        }
      }
    } catch(err) {
      console.log(err);
      this.toast.showError(err);
    }
  }
}