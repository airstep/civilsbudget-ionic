import { Platform } from 'ionic-angular';
import { ToastService } from './toast';
import { Subscription } from 'rxjs';
import { Network } from '@ionic-native/network';
import { Injectable } from '@angular/core';

@Injectable()
export class NetworkService {
  connected: Subscription
  disconnected: Subscription
  
  constructor(
    private network: Network,
    private toast: ToastService,
    private platform: Platform
  ) {

  }

  getType() {
    if (this.platform.is('cordova'))
      return this.network.type
    return
  }

  isOffline() {
    return this.network.type === 'none'
  }

  isOnline() {
    return !this.isOffline()
  }

  initEvents() {
    this.connected = this.network.onConnect().subscribe(data => {
      console.log(data)
      this.showInfo(data.type);
    }, error => console.error(error));
  
    this.disconnected = this.network.onDisconnect().subscribe(data => {
      console.log(data)
      this.showInfo(data.type);
    }, error => console.error(error));
  }

  clearEvents() {
    this.connected.unsubscribe();
    this.disconnected.unsubscribe();    
  }

  showInfo(connectionState: string){
    let networkType = this.network.type
    if (networkType === "none")
      this.toast.show(`You are now ${connectionState}. Please check internet connection!`);
    else
      this.toast.show(`You are now ${connectionState} via ${networkType}`);
  }  
}