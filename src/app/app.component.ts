import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from '@ngx-translate/core';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = 'HomePage';

  constructor(
    platform: Platform, 
    statusBar: StatusBar, 
    public translate: TranslateService,
    splashScreen: SplashScreen) {
    platform.ready().then(() => {
      this.setLanguage('ua');      
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });
  }

  setLanguage(lang) {
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
  }  
}

