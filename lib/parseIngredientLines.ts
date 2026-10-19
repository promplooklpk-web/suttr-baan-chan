import { parseAmountInput } from '@/lib/amountParse';
import type { RecipeIngredient } from '@/types/recipe';

const UNIT_PATTERN =
  /(กรัม|กก\.|มล\.|ลิตร|ช้อนโต๊ะ|ช้อนชา|ถ้วย|ฟอง|ฝัก|หัว|กำ|ซอง|แพ็ค|ผล|ชิ้น|เม็ด|กลีบ|ต้น|g|kg|ml|l)$/i;

const AMOUNT_THEN_UNIT =
  /^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*(กรัม|กก\.|มล\.|ลิตร|ช้อนโต๊ะ|ช้อนชา|ถ้วย|ฟอง|ฝัก|หัว|กำ|ซอง|แพ็ค|ผล|ชิ้น|เม็ด|กลีบ|ต้น|g|kg|ml|l)\s*(.+)$/i;

/** Split pasted multi-line ingredient text into rows (LINE / Facebook style). */
export function parseIngredientLines(text: string): RecipeIngredient[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: RecipeIngredient[] = [];
  for (const line of lines) {
    const bullet = line.replace(/^[-•*]\s*/, '').trim();
    if (!bullet) continue;

    const gluedOnly = bullet.match(
      /^(\d+(?:[.,]\d+)?)(กรัม|กก\.|มล\.|ลิตร|ช้อนโต๊ะ|ช้อนชา|ถ้วย|ฟอง|ฝัก|หัว|กำ|ซอง|แพ็ค|ผล|ชิ้น|เม็ด|กลีบ|ต้น|g|kg|ml|l)$/i,
    );
    if (gluedOnly) {
      out.push({
        name: '',
        amount: parseAmountInput(gluedOnly[1]),
        unit: gluedOnly[2],
      });
      continue;
    }

    const glued = bullet.match(/^(\d+(?:[.,]\d+)?)(กรัม|กก\.|มล\.|ลิตร|ช้อนโต๊ะ|ช้อนชา|ถ้วย|ฟอง|ฝัก|หัว|กำ|ซอง|แพ็ค|ผล|ชิ้น|เม็ด|กลีบ|ต้น|g|kg|ml|l)(.+)$/i);
    if (glued) {
      const amount = parseAmountInput(glued[1]);
      const unit = glued[2];
      const name = glued[3].trim();
      if (name) {
        out.push({ name, amount, unit });
        continue;
      }
    }

    const amtUnitName = bullet.match(AMOUNT_THEN_UNIT);
    if (amtUnitName) {
      const amount = parseAmountInput(amtUnitName[1]);
      out.push({
        name: amtUnitName[3].trim(),
        amount,
        unit: amtUnitName[2],
      });
      continue;
    }

    const amountUnitOnly = bullet.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s+(\S+)$/);
    if (amountUnitOnly && UNIT_PATTERN.test(amountUnitOnly[2])) {
      const amount = parseAmountInput(amountUnitOnly[1]);
      out.push({ name: '', amount, unit: amountUnitOnly[2] });
      continue;
    }

    const parts = bullet.split(/\s+/);
    if (parts.length === 0) continue;
    let unit: string | undefined;
    let amount: number | undefined;
    let nameParts = [...parts];
    const last = parts[parts.length - 1];
    if (UNIT_PATTERN.test(last)) {
      unit = last;
      nameParts = parts.slice(0, -1);
      const maybeAmount = nameParts[nameParts.length - 1];
      const parsed = maybeAmount ? parseAmountInput(maybeAmount) : undefined;
      if (parsed != null) {
        amount = parsed;
        nameParts = nameParts.slice(0, -1);
      }
    } else {
      const first = parts[0];
      const parsed = parseAmountInput(first);
      if (parsed != null && parts.length > 1) {
        amount = parsed;
        nameParts = parts.slice(1);
        if (nameParts.length > 0 && UNIT_PATTERN.test(nameParts[nameParts.length - 1])) {
          unit = nameParts.pop();
        }
      }
    }
    const name = nameParts.join(' ').trim();
    if (!name) {
      out.push({ name: bullet, amount: undefined, unit: undefined });
      continue;
    }
    out.push({ name, amount, unit });
  }
  return out;
}
