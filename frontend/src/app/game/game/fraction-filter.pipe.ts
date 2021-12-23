import {Pipe, PipeTransform} from "@angular/core";

export function transformToFraction(v: number | undefined): string | undefined {
  if (v == undefined) {
    return undefined;
  } else if (v == -1) {
    return '?';
  } else if (v == 0.25) {
    return '¼';
  } else if (v == 0.5) {
    return '½';
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
