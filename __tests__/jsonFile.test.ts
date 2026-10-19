import {
  deleteAsync,
  getInfoAsync,
  moveAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import { readJsonFile, readJsonFileResult, writeJsonFileAtomic } from '@/lib/jsonFile';

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

  it('recovers from .tmp when main is missing (kill after delete, before rename)', async () => {
    const payload = { items: [{ id: 'a' }] };
    (getInfoAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p === '/doc/data.json') return { exists: false };
      if (p === '/doc/data.json.tmp') return { exists: true };
      if (p === '/doc/data.json.bak') return { exists: false };
      return { exists: false };
    });
    (readAsStringAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p === '/doc/data.json.tmp') return JSON.stringify(payload);
      throw new Error('missing');
    });

    const result = await readJsonFileResult<typeof payload>('/doc/data.json');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe('tmp');
      expect(result.data).toEqual(payload);
    }
  });

  it('recovers from .bak when main and tmp are missing', async () => {
    const payload = { items: [1, 2] };
    (getInfoAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p.endsWith('.bak')) return { exists: true };
      return { exists: false };
    });
    (readAsStringAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p.endsWith('.bak')) return JSON.stringify(payload);
      throw new Error('missing');
    });

    const data = await readJsonFile('/doc/data.json', { items: [] });
    expect(data).toEqual(payload);
  });

  it('simulates kill mid-save: main gone, tmp has new data', async () => {
    (getInfoAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p === '/doc/data.json') return { exists: false };
      if (p === '/doc/data.json.tmp') return { exists: true };
      if (p === '/doc/data.json.bak') return { exists: true };
      return { exists: false };
    });
    (readAsStringAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p.endsWith('.tmp')) return JSON.stringify({ v: 'new' });
      if (p.endsWith('.bak')) return JSON.stringify({ v: 'old' });
      throw new Error('no main');
    });

    const result = await readJsonFileResult<{ v: string }>('/doc/data.json');
    expect(result.ok && result.source === 'tmp' && result.data.v).toBe('new');
  });

  it('quarantines corrupt file without backup', async () => {
    (getInfoAsync as jest.Mock).mockImplementation(async (p: string) => {
      if (p.endsWith('.bak')) return { exists: false };
      if (p.endsWith('.corrupt')) return { exists: false };
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
