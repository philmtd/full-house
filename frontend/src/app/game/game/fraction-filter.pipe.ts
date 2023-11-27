import {Pipe, PipeTransform} from "@angular/core";

export function transformToFraction(v: number | undefined): string | undefined {
  if (v == undefined) {
    return undefined;
  } else if (v == -1) {
    return '?';
  } else if (v == 0.125) {
    return '⅛';
  } else if (v == 0.25) {
    return '¼';
  } else if (v.toFixed(2) === '0.33') {
    return '⅓';
  } else if (v == 0.5) {
    return '½';
  } else if (v.toFixed(2) === '0.66') {
    return '⅔';
  } else if (v == 0.75) {
    return '¾';
  } else if (v > 1 && v%1 > 0) {
    let fraction = transformToFraction(v%1) || ''
    let utf8Fractions = ['⅛', '¼', '⅓', '½', '⅔', '¾']
    let isUtf8Fraction = utf8Fractions.includes(fraction)
    return `${Math.trunc(v)}${isUtf8Fraction ? '' : '.'}${isUtf8Fraction ? fraction : Math.trunc(v%1*10)}`
  } else {
    return `${v}`
  }
}

@Pipe({
  name: 'fraction',
  pure: true
})
export class FractionFilterPipe implements PipeTransform {

  transform(v: number | undefined): string | undefined {
    return transformToFraction(v);
  }

}
