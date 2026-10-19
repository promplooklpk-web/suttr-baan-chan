export type ShoppingGroup = 'meat' | 'veg' | 'pantry' | 'sauces' | 'other';

const SAUCES = /น้ำปลา|น้ำมันหอย|ซีอิ๊ว|น้ำส้ม|น้ำพริก|น้ำตาลปี๊บ|มะขามเปียก|น้ำมันพืช|น้ำมันงา|น้ำมัน/i;
const MEAT = /หมู|ไก่|เนื้อ|กุ้ง|หมึก|ไข่|เบคอน|หอย(?!น้ำ)|ลูกชิ้น|อกไก่|สันใน|สามชั้น|ปลา(?!น้ำ)/i;
const VEG = /ผัก|กะเพรา|พริก(?!ไทย|ป่น)|หอม|กระเทียม|มะเขือ|แตง|คะน้า|ผักชี|ต้นหอม|มะนาว|มะละกอ|แครอท|เห็ด|ถั่ว|ผักบุ้ง/i;
const PANTRY = /น้ำตาล|เกลือ|แป้ง|ข้าว|พริกไทย|พริกป่น|กะทิ|นม|เนื้อย|เครื่องปรุง|แป้งทอด/i;

export function shoppingGroupForName(name: string): ShoppingGroup {
  const n = name.trim();
  if (SAUCES.test(n)) return 'sauces';
  if (MEAT.test(n)) return 'meat';
  if (VEG.test(n)) return 'veg';
  if (PANTRY.test(n)) return 'pantry';
  return 'other';
}

export const SHOPPING_GROUP_LABELS: Record<ShoppingGroup, string> = {
  meat: 'เนื้อสัตว์ / ไข่',
  veg: 'ผัก / ผักสมุนไพร',
  pantry: 'เครื่องปรุง / ของแห้ง',
  sauces: 'ซอส / น้ำปรุง',
  other: 'อื่นๆ',
};

export const SHOPPING_GROUP_ORDER: ShoppingGroup[] = ['meat', 'veg', 'sauces', 'pantry', 'other'];
