export type ShoppingGroup = 'meat' | 'veg' | 'pantry' | 'other';

const MEAT = /หมู|ไก่|เนื้อ|ปลา|กุ้ง|หมึก|ไข่|เบคอน|หอย|ลูกชิ้น|อกไก่|สันใน|สามชั้น/i;
const VEG = /ผัก|กะเพรา|พริก|หอม|กระเทียม|มะเขือ|แตง|คะน้า|ผักชี|ต้นหอม|มะนาว|มะละกอ|แครอท|เห็ด|ถั่ว|ผักบุ้ง/i;
const PANTRY = /น้ำปลา|น้ำตาล|เกลือ|น้ำมัน|แป้ง|ข้าว|พริกไทย|ซีอิ๊ว|น้ำส้ม|น้ำพริก|กะทิ|นม|เนย|สะหล่ำ|เครื่องปรุง/i;

export function shoppingGroupForName(name: string): ShoppingGroup {
  const n = name.trim();
  if (MEAT.test(n)) return 'meat';
  if (VEG.test(n)) return 'veg';
  if (PANTRY.test(n)) return 'pantry';
  return 'other';
}

export const SHOPPING_GROUP_LABELS: Record<ShoppingGroup, string> = {
  meat: 'เนื้อสัตว์ / ไข่',
  veg: 'ผัก / ผักสมุนไพร',
  pantry: 'เครื่องปรุง / ของแห้ง',
  other: 'อื่นๆ',
};

export const SHOPPING_GROUP_ORDER: ShoppingGroup[] = ['meat', 'veg', 'pantry', 'other'];
