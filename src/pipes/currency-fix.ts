import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFix',
})
export class CurrencyFixPipe implements PipeTransform {
  transform(value: string, ...args) {
    value = value.replace('UAH', '');
    value = value.replace(new RegExp(',', 'g'), ' ');
    if (value.lastIndexOf('.') > 0) 
      value = value.substring(0, value.lastIndexOf('.'));
    return value.toLowerCase();
  }
}
