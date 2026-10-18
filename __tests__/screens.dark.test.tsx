import { useLocalSearchParams } from 'expo-router';

import { seedFridgeItems, seedRecipe } from '@/__tests__/fixtures/seed';
import { renderWithProviders } from '@/__tests__/testProviders';
import AboutScreen from '@/app/about';
import ExportSelectScreen from '@/app/export/select';
import FridgeDetailScreen from '@/app/fridge/[id]';
import FridgeMatchScreen from '@/app/fridge/match/[recipeId]';
import HomeScreen from '@/app/(tabs)/index';
import SearchScreen from '@/app/(tabs)/search';
import FridgeScreen from '@/app/(tabs)/fridge';
import PlannerScreen from '@/app/(tabs)/planner';
import PickerScreen from '@/app/(tabs)/picker';
import SettingsScreen from '@/app/(tabs)/settings';
import RecipeDetailScreen from '@/app/recipe/[id]';
import RecipeEditScreen from '@/app/recipe/edit';
import CookScreen from '@/app/recipe/cook/[id]';
import TagsManagementScreen from '@/app/tags/index';

const mockedParams = useLocalSearchParams as unknown as jest.Mock;

const dark = { colorScheme: 'dark' as const };

describe('dark theme screen smoke', () => {
  beforeEach(() => {
    mockedParams.mockReturnValue({});
  });

  it('Home', async () => {
    const { findByText } = renderWithProviders(<HomeScreen />, dark);
    await findByText('ข้าวผัดไก่');
  });

  it('Search', async () => {
    const { findByPlaceholderText } = renderWithProviders(<SearchScreen />, dark);
    await findByPlaceholderText('ค้นหาจากชื่อสูตร ส่วนผสม แท็ก');
  });

  it('Fridge', async () => {
    const { findByText } = renderWithProviders(<FridgeScreen />, dark);
    await findByText('ตู้เย็นของฉัน');
  });

  it('Picker', async () => {
    const { findByText } = renderWithProviders(<PickerScreen />, dark);
    await findByText('วันนี้กินอะไรดี?');
    await findByText('สุ่มเมนูใหม่');
  });

  it('Planner', async () => {
    const { findByText } = renderWithProviders(<PlannerScreen />, dark);
    await findByText('วันนี้');
  });

  it('Settings', async () => {
    const { findByText } = renderWithProviders(<SettingsScreen />, dark);
    await findByText('ยันยง P.');
  });

  it('Recipe detail', async () => {
    mockedParams.mockReturnValue({ id: seedRecipe.id });
    const { findByText } = renderWithProviders(<RecipeDetailScreen />, dark);
    await findByText(seedRecipe.title);
    await findByText('เริ่มทำเมนูนี้');
  });

  it('Recipe edit (new)', async () => {
    const { findByText } = renderWithProviders(<RecipeEditScreen />, dark);
    await findByText('เพิ่มสูตรใหม่');
  });

  it('Cooking mode', async () => {
    mockedParams.mockReturnValue({ id: seedRecipe.id });
    const { findByText } = renderWithProviders(<CookScreen />, dark);
    await findByText(/ขั้นที่/);
  });

  it('Tags', async () => {
    const { findByText } = renderWithProviders(<TagsManagementScreen />, dark);
    await findByText(/แก้ไขชื่อแท็ก/);
  });

  it('Export select', async () => {
    const { findByText } = renderWithProviders(<ExportSelectScreen />, dark);
    await findByText('ข้าวผัดไก่');
  });

  it('About', async () => {
    const { findByText } = renderWithProviders(<AboutScreen />, dark);
    await findByText('สูตรบ้านฉัน');
  });

  it('Fridge item detail', async () => {
    mockedParams.mockReturnValue({ id: seedFridgeItems[0].id });
    const { findByText } = renderWithProviders(<FridgeDetailScreen />, dark);
    await findByText(seedFridgeItems[0].name);
  });

  it('Fridge recipe match', async () => {
    mockedParams.mockReturnValue({ recipeId: seedRecipe.id });
    const { findByText } = renderWithProviders(<FridgeMatchScreen />, dark);
    await findByText(seedRecipe.title);
  });
});
