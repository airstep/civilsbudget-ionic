import { Component, Input, ElementRef, Renderer } from '@angular/core';
import { NgZone } from '@angular/core';

@Component({
  selector: 'expandable-header',
  templateUrl: 'expandable-header.html'
})
// source: https://www.joshmorony.com/creating-a-custom-expandable-header-component-for-ionic-2/
export class ExpandableHeader {

  @Input('scrollArea') scrollArea: any;
  @Input('headerHeight') headerHeight: number;

  newHeaderHeight: any;

  constructor(
    public element: ElementRef, 
    public renderer: Renderer
  ) { 
  }

  ngOnInit() {
    this.renderer.setElementStyle(this.element.nativeElement, 'height', this.headerHeight + 'px');
    this.scrollArea.ionScroll.subscribe((ev) => {
      this.resizeHeader(ev);
    });
  }

  resizeHeader(ev) {
    ev.domWrite(() => {
      this.newHeaderHeight = this.headerHeight - ev.scrollTop;

      if (this.newHeaderHeight < 0)
        this.newHeaderHeight = 0;

      // fix: infinite scroll is checking the first scrollable area registered to see 
      // if it should keep going and not necessarily the one it's inside.
      // The size of the page changing according to the resizing of the header and 
      // we need to actualizate the variable size of scrollable area registered.
      if (this.newHeaderHeight > 0)
        this.scrollArea.resize();
      // end fix
                  
      this.renderer.setElementStyle(this.element.nativeElement, 'height', this.newHeaderHeight + 'px');

      for (let headerElement of this.element.nativeElement.children) {
        let totalHeight = headerElement.offsetTop + headerElement.clientHeight;

        if (totalHeight > this.newHeaderHeight && !headerElement.isHidden) {
          headerElement.isHidden = true;
          this.renderer.setElementStyle(headerElement, 'opacity', '0.5');
        } else if (totalHeight <= this.newHeaderHeight && headerElement.isHidden) {
          headerElement.isHidden = false;
          this.renderer.setElementStyle(headerElement, 'opacity', '0.7');
        }
      }
    });
  }
}