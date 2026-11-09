const { withNativeFederation } = require('@softarc/native-federation/build');

module.exports = withNativeFederation({
  name: 'notifications',

  /**
   * The shell loads `./mount` from MountedRemoteComponent and calls
   * mount(element, bridge), which returns the unmount function.
   */
  exposes: {
    './mount': './src/mount.tsx',
  },

  /**
   * Nothing is shared: the shell has no React to share, so React is bundled
   * into `./mount`. Sharing it would only add a CommonJS-to-ESM step.
   */
  shared: {},
});
