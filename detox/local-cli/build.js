const _ = require('lodash');
const fs = require('fs');
const cp = require('child_process');
const log = require('../src/utils/logger').child({ __filename });
const {composeDetoxConfig} = require('../src/configuration');

module.exports.command = 'build';
module.exports.desc = "Runs the user-provided build command, as defined in the 'build' property of the specified configuration.";
module.exports.builder = {
  C: {
    alias: 'config-path',
    group: 'Configuration:',
    describe: 'Specify Detox config file path. If not supplied, detox searches for .detoxrc[.js] or "detox" section in package.json',
  },
  c: {
    alias: 'configuration',
    group: 'Configuration:',
    describe:
      "Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it",
  },
  s: {
    alias: 'silent',
    group: 'Configuration:',
    boolean: true,
    describe:
      "Do not fail with error if an app config has no build command.",
  },
};

module.exports.handler = async function build(argv) {
  const { errorBuilder, appsConfig } = await composeDetoxConfig({ argv });

  for (const app of Object.values(appsConfig)) {
    const buildScript = app.build;

    if (buildScript) {
      try {
        log.info(buildScript);
        cp.execSync(buildScript, { stdio: 'inherit' });
      } catch (e) {
        log.warn("\n\nImportant: 'detox build' is a convenience shortcut for calling your own build command, as provided in the config file.\nFailures in this build command are not the responsibility of Detox. You are responsible for maintaining this command.\n");
        throw e;
      }
    } else if (!argv.silent) {
      throw errorBuilder.missingBuildScript();
    }

    if (app.binaryPath && !fs.existsSync(app.binaryPath)) {
      log.warn("\nImportant: after running the build command, Detox could not find your app at the given binary path:\n\t" + app.binaryPath + "\nMake sure it is correct, otherwise you'll get an error on an attempt to install your app.\n");
    }
  }
};
