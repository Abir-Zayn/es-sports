const { addJitpack } = require('../with-live-stream');

const TEMPLATE = `allprojects {
  repositories {
    google()
    mavenCentral()
  }
}`;

describe('with-live-stream addJitpack', () => {
  it('adds JitPack to allprojects.repositories', () => {
    expect(addJitpack(TEMPLATE)).toContain("maven { url 'https://www.jitpack.io' }");
  });

  it('is idempotent', () => {
    const once = addJitpack(TEMPLATE);
    expect(addJitpack(once)).toBe(once);
  });

  it('leaves files that already have JitPack untouched', () => {
    const existing = `${TEMPLATE}\nmaven { url 'https://jitpack.io' }`;
    expect(addJitpack(existing)).toBe(existing);
  });
});
