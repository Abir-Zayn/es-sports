import * as Updates from 'expo-updates';
import { AppState, type AppStateStatus } from 'react-native';

import { watchBackgroundUpdates } from '../background-updates';

jest.mock('expo-updates', () => ({
  isEnabled: true,
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(async () => undefined),
}));

let onChange: (status: AppStateStatus) => void = () => undefined;
const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    onChange = handler as (status: AppStateStatus) => void;
    return { remove: jest.fn() } as never;
  });
});

describe('background OTA updates', () => {
  it('downloads a new update in the background and runs it when the user comes back', async () => {
    jest.mocked(Updates.checkForUpdateAsync).mockResolvedValue({ isAvailable: true } as never);
    jest.mocked(Updates.fetchUpdateAsync).mockResolvedValue({ isNew: true } as never);
    watchBackgroundUpdates();
    await flush();
    expect(Updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);

    onChange('active'); // still in the app: no reload
    expect(Updates.reloadAsync).not.toHaveBeenCalled();
    onChange('background');
    onChange('active');
    expect(Updates.reloadAsync).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is no update, or the check fails offline', async () => {
    jest.mocked(Updates.checkForUpdateAsync).mockRejectedValueOnce(new Error('offline'));
    watchBackgroundUpdates();
    await flush();
    onChange('background');
    onChange('active');
    expect(Updates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(Updates.reloadAsync).not.toHaveBeenCalled();
  });
});
