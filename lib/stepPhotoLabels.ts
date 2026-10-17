import type { StepPhotoMatch } from '@/types/recipe';

export function stepPhotoMatchLabel(match?: StepPhotoMatch): string {
  switch (match) {
    case 'technique':
      return 'ภาพประกอบเทคนิค';
    case 'ingredient':
      return 'ภาพวัตถุดิบ';
    case 'serving-example':
      return 'ภาพตัวอย่างการเสิร์ฟ';
    case 'similar-recipe':
      return 'สูตรคล้ายกัน';
    default:
      return 'ภาพประกอบ';
  }
}
