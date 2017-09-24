import { TranslateModule } from '@ngx-translate/core';
import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { HomePage } from './home';
import { MomentModule } from 'angular2-moment';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  declarations: [
    HomePage,
  ],
  imports: [
    IonicPageModule.forChild(HomePage),
    TranslateModule.forChild(),
    ComponentsModule,
    MomentModule  
  ],
  exports: [
    HomePage
  ]
})
export class HomePageModule {}
