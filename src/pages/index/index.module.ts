import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { IndexPage } from './index';
import { MomentModule } from 'angular2-moment';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    IndexPage,
  ],
  imports: [
    IonicPageModule.forChild(IndexPage),
    TranslateModule.forChild(),
    MomentModule  
  ],
})
export class IndexPageModule {}
