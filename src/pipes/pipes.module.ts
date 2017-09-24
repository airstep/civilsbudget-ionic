import { IonicModule } from 'ionic-angular';
import { NgModule } from '@angular/core';
import { CurrencyFixPipe } from './currency-fix';

@NgModule({
  declarations: [
    CurrencyFixPipe
  ],
  imports: [
    IonicModule
  ],
  exports: [
    CurrencyFixPipe
  ]
})
export class PipesModule {}