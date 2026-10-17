import { fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';

import { seedRecipe } from '@/__tests__/fixtures/seed';
import { renderWithProviders } from '@/__tests__/testProviders';
import HomeScreen from '@/app/(tabs)/index';
import SearchScreen from '@/app/(tabs)/search';
import FridgeScreen from '@/app/(tabs)/fridge';
import PlannerScreen from '@/app/(tabs)/planner';
import PickerScreen from '@/app/(tabs)/picker';
import SettingsScreen from '@/app/(tabs)/settings';
import RecipeDetailScreen from '@/app/recipe/[id]';

const mockedParams = useLocalSearchParams as unknown as jest.Mock;

describe('screen smoke tests', () => {
  beforeEach(() => {
    mockedParams.mockReturnValue({});
  });

  it('renders Home', async () => {
    const { findByText } = renderWithProviders(<HomeScreen />);
    await findByText('สูตรทั้งหมด');
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

  it('renders Planner', async () => {
    const { findByText } = renderWithProviders(<PlannerScreen />);
    await findByText('สัปดาห์นี้');
  });

  it('renders Picker', async () => {
    const { findByText } = renderWithProviders(<PickerScreen />);
    await findByText('กินอะไรดี');
  });

  it('renders Settings', async () => {
    const { findByText } = renderWithProviders(<SettingsScreen />);
    await findByText('ตั้งค่า');
  });

  it('renders Recipe detail with fridge match section', async () => {
    mockedParams.mockReturnValue({ id: seedRecipe.id });
    const { findByText } = renderWithProviders(<RecipeDetailScreen />);
    await findByText(seedRecipe.title);
    await findByText('ส่วนผสม');
  });
});
