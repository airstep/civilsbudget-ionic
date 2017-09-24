import { Component } from '@angular/core';

import { NavController, IonicPage } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-test',
  templateUrl: 'test.html'
})
export class TestPage {

	testData: any = new Array(5);

	constructor(public navCtrl: NavController) {

	}

}
