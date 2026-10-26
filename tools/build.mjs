// Builds the remote into dist/: remoteEntry.json plus the `./mount` bundle.
// With --watch it rebuilds whenever src/ changes (development build).

import { mkdirSync, rmSync, watch } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Both packages are CommonJS without an exports map, so load them with require.
const require = createRequire(import.meta.url);
const { federationBuilder } = require('@softarc/native-federation/build');
const { createEsBuildAdapter } = require('@softarc/native-federation-esbuild');

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = 'dist';
const watchMode = process.argv.includes('--watch');

// The adapter does not replace process.env.NODE_ENV in exposed modules, and
// React reads it; without this the bundle throws in the browser.
const nodeEnvPlugin = {
  name: 'node-env',
  setup(build) {
    build.initialOptions.define = {
      ...build.initialOptions.define,
      'process.env.NODE_ENV': JSON.stringify(watchMode ? 'development' : 'production'),
    };
  },
};

rmSync(join(workspaceRoot, outputPath), { recursive: true, force: true });
mkdirSync(join(workspaceRoot, outputPath), { recursive: true });

await federationBuilder.init({
  options: {
    workspaceRoot,
    outputPath,
    tsConfig: 'tsconfig.json',
    federationConfig: 'federation.config.cjs',
    dev: watchMode,
    verbose: false,
  },
  adapter: createEsBuildAdapter({ plugins: [nodeEnvPlugin] }),
});

await federationBuilder.build();
console.log(`notifications portal built into ${outputPath}/`);

if (watchMode) {
  let pending;
  watch(join(workspaceRoot, 'src'), { recursive: true }, () => {
    clearTimeout(pending);
    pending = setTimeout(async () => {
      try {
        await federationBuilder.build({ skipShared: true });
        console.log('rebuilt');
      } catch (error) {
        console.error(error);
      }
    }, 100);
  });
  console.log('watching src/');
}
