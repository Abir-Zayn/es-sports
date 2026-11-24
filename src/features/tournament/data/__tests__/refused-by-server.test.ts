import { refusedByServer } from '../tournament-errors';

describe('refusedByServer', () => {
  it('is true only for codes the server sends back', () => {
    expect(refusedByServer({ code: 'ET006' })).toBe(true);
    expect(refusedByServer({ code: '42501' })).toBe(true);
    expect(refusedByServer({ code: 'PGRST116' })).toBe(true);
  });

  it('is false for lost connections, timeouts and aborts, where the change may have been saved', () => {
    expect(refusedByServer({ code: '' })).toBe(false);
    expect(refusedByServer({ code: 'ECONNRESET' })).toBe(false);
    expect(refusedByServer({ code: 'ABORT_ERR' })).toBe(false);
    expect(refusedByServer({ code: null })).toBe(false);
    expect(refusedByServer(new Error('Network request failed'))).toBe(false);
  });
});
