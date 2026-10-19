import {
  deleteAsync,
  getInfoAsync,
  moveAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import { readJsonFile, writeJsonFileAtomic } from '@/lib/jsonFile';

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  moveAsync: jest.fn(),
}));

describe('jsonFile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('writeJsonFileAtomic moves tmp into place', async () => {
    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
    (moveAsync as jest.Mock).mockResolvedValue(undefined);

    await writeJsonFileAtomic('/doc/data.json', { ok: true });

    expect(writeAsStringAsync).toHaveBeenCalledWith('/doc/data.json.tmp', expect.stringContaining('"ok"'));
    expect(moveAsync).toHaveBeenCalledWith({ from: '/doc/data.json.tmp', to: '/doc/data.json' });
  });

  it('readJsonFile returns fallback when missing', async () => {
    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    const data = await readJsonFile('/doc/missing.json', { items: [] });
    expect(data).toEqual({ items: [] });
    expect(readAsStringAsync).not.toHaveBeenCalled();
  });

  it('quarantines corrupt file without backup', async () => {
    (getInfoAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p.endsWith('.bak')) return { exists: false };
      return { exists: true };
    });
    (readAsStringAsync as jest.Mock).mockRejectedValue(new Error('parse'));
    (deleteAsync as jest.Mock).mockResolvedValue(undefined);
    (moveAsync as jest.Mock).mockResolvedValue(undefined);

    const data = await readJsonFile('/doc/bad.json', { items: [] });
    expect(data).toEqual({ items: [] });
    expect(moveAsync).toHaveBeenCalledWith({ from: '/doc/bad.json', to: '/doc/bad.json.corrupt' });
  });
});
