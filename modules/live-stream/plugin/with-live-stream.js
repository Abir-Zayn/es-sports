// Expo config plugin for the local live-stream module.
// RootEncoder is published on JitPack. The app module resolves the module's transitive dependencies with the
// root project's repositories, so JitPack must be in allprojects.repositories. The current Expo template already
// includes it; this plugin guarantees it (idempotently) if a future template drops the line.
// Permissions and the foreground service come from the module's AndroidManifest.xml via manifest merging.
const { withProjectBuildGradle } = require('expo/config-plugins');

const JITPACK = "maven { url 'https://www.jitpack.io' }";

function addJitpack(contents) {
  if (/jitpack\.io/.test(contents)) return contents;
  return contents.replace(/allprojects\s*\{\s*repositories\s*\{/, (match) => `${match}\n    ${JITPACK}`);
}

module.exports = function withLiveStream(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('with-live-stream: expected a Groovy android/build.gradle');
    }
    const next = addJitpack(cfg.modResults.contents);
    if (!/jitpack\.io/.test(next)) {
      throw new Error('with-live-stream: could not add the JitPack repository to android/build.gradle');
    }
    cfg.modResults.contents = next;
    return cfg;
  });
};

module.exports.addJitpack = addJitpack;
