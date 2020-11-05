import { TranslateService } from '@ngx-translate/core';
import { ToastController, AlertController, Toast, Alert } from 'ionic-angular';
import { Injectable } from '@angular/core';

@Injectable()
export class ToastService {
  toast: Toast
  alert: Alert

  constructor(
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private alertCtrl: AlertController
  ){

  }

  dispose() {
    if (this.toast)
      this.toast.dismissAll()
    
    if (this.alert)
      this.alert.dismiss()
  }

  show(msg) {
    this.showInTime(msg, 3000)
  }

  showInTime(msg, time) {
    this.toast = this.toastCtrl.create({
      message: msg,
      duration: time,
      position: 'bottom'
    });
    this.toast.present();
  }

  showError(err) {
    if (err.name && err.name.length > 0)
      this.show(err.name + (err.message) ? ": " + err.message : "")
    else if (err.code) {
      this.show(err.code + (err.message) ? ": " + err.message : "")
    } else if (err.message) {
      this.show(err.message)
    } else if (err.stack) {
      this.show(err.stack.toString())
    } else if (err) {
      this.show(err)
    } else {
      this.show(this.translate.instant('UNKNOWN_ERROR'))
    }
  }

  dismiss() {
    if (this.toast)
      this.toast.dismiss()
  }

  handleError(e: Error): void {
    console.error(e);

    this.alert = this.alertCtrl.create({
      title: this.translate.instant('SORRY'),
      message: e.message,
      buttons: [this.translate.instant('OK')]
    });

    this.alert.present();
  }  

  showAlert(message:string): Alert {

    this.alert = this.alertCtrl.create({
      message: message,
      buttons: [this.translate.instant('OK')]
    });

    this.alert.present();

    return this.alert;
  }  

  showConfirmAlert(message, cb) {
    this.alert = this.alertCtrl.create({
      message: message,
      buttons: [
        {
          text: 'Нi',
          handler: () => {
            this.dismiss()
          }
        },
        {
          text: 'Так',
          handler: cb
        }
      ]
    })
    this.alert.present();
  }
}
