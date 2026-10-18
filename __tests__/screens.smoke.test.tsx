import { fireEvent } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { seedRecipe } from '@/__tests__/fixtures/seed';
import { renderWithProviders } from '@/__tests__/testProviders';
import HomeScreen from '@/app/(tabs)/index';
import SearchScreen from '@/app/(tabs)/search';
import FridgeScreen from '@/app/(tabs)/fridge';
import PlannerScreen from '@/app/(tabs)/planner';
import PickerScreen from '@/app/(tabs)/picker';
import SettingsScreen from '@/app/(tabs)/settings';
import RecipeDetailScreen from '@/app/recipe/[id]';
import TagsManagementScreen from '@/app/tags/index';

const mockedParams = useLocalSearchParams as unknown as jest.Mock;

describe('screen smoke tests', () => {
  beforeEach(() => {
    mockedParams.mockReturnValue({});
    jest.mocked(router.push).mockClear();
  });

  it('renders Home in dark theme', async () => {
    const { findByText, findAllByText } = renderWithProviders(<HomeScreen />, { colorScheme: 'dark' });
    await findByText('ข้าวผัดไก่');
    expect((await findAllByText('สูตรทั้งหมด')).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Settings theme controls in dark theme', async () => {
    const { findByText } = renderWithProviders(<SettingsScreen />, { colorScheme: 'dark' });
    await findByText('ธีม');
    await findByText('ตามระบบ');
  });

  it('renders Picker in dark theme', async () => {
    const { findByText } = renderWithProviders(<PickerScreen />, { colorScheme: 'dark' });
    await findByText('วันนี้กินอะไรดี?');
    await findByText('สุ่มเมนูใหม่');
  });

  it('renders Home with full-width recipe list', async () => {
    const { findByText, findAllByText } = renderWithProviders(<HomeScreen />);
    await findByText('ข้าวผัดไก่');
    expect((await findAllByText('สูตรทั้งหมด')).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Search with results', async () => {
    const { findByText, getByPlaceholderText } = renderWithProviders(<SearchScreen />);
    const input = getByPlaceholderText('ค้นหาจากชื่อสูตร ส่วนผสม แท็ก');
    fireEvent.changeText(input, 'ลาบ');
    await findByText('ลาบไก่อกไก่ลวกไม่ใช้น้ำมัน');
  });

  it('renders Fridge with seeded items', async () => {
    const { findByText } = renderWithProviders(<FridgeScreen />);
    await findByText('ของในตู้ 2');
  });

  it('renders Fridge in dark theme', async () => {
    const { findByText } = renderWithProviders(<FridgeScreen />, { colorScheme: 'dark' });
    await findByText('ตู้เย็นของฉัน');
    await findByText(/ของในตู้/);
  });

  it('renders Planner with day view', async () => {
    const { findByText, getAllByText } = renderWithProviders(<PlannerScreen />);
    await findByText('วันนี้');
    expect(getAllByText('เพิ่มเมนู').length).toBeGreaterThanOrEqual(1);
    await findByText(/รวมประมาณ/);
  });

  it('renders Planner in dark theme', async () => {
    const { findByText } = renderWithProviders(<PlannerScreen />, { colorScheme: 'dark' });
    await findByText('วันนี้');
    await findByText('แพลนมื้อ');
  });

  it('renders Picker with hero and shuffle CTA', async () => {
    const { findByText, getByLabelText } = renderWithProviders(<PickerScreen />);
    await findByText('วันนี้กินอะไรดี?');
    await findByText('สุ่มเมนูใหม่');
    expect(getByLabelText('ตัวกรอง')).toBeTruthy();
  });

  it('renders Settings', async () => {
    const { findByText } = renderWithProviders(<SettingsScreen />);
    await findByText('บัญชีและแอป');
    await findByText('สูตรของฉัน');
  });

  it('renders Tags management screen', async () => {
    const { findByText } = renderWithProviders(<TagsManagementScreen />);
    await findByText(/แก้ไขชื่อแท็กจะอัปเดตทุกสูตรที่ใช้แท็กนี้/);
  });

  it('navigates to /tags from Settings', async () => {
    const { findByText } = renderWithProviders(<SettingsScreen />);
    fireEvent.press(await findByText('จัดการแท็ก'));
    expect(router.push).toHaveBeenCalledWith('/tags');
  });

  it('renders Recipe detail with fridge match section', async () => {
    mockedParams.mockReturnValue({ id: seedRecipe.id });
    const { findByText } = renderWithProviders(<RecipeDetailScreen />);
    await findByText(seedRecipe.title);
    await findByText('ส่วนผสม');
  });

  it('renders Recipe detail in dark theme', async () => {
    mockedParams.mockReturnValue({ id: seedRecipe.id });
    const { findByText } = renderWithProviders(<RecipeDetailScreen />, { colorScheme: 'dark' });
    await findByText(seedRecipe.title);
    await findByText('เริ่มทำเมนูนี้');
  });
});
