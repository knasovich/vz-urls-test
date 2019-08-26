const fs = require('fs-extra');
const path = require('path');
const { Launcher } = require('webdriverio');
const program = require('commander');
const { cleanFileName, findFile, getFileDateString } = require('./lib/clihelper');
const MochawesomeReportGenerator = require('./reporting/mocha_report/mocha_report_gen');

// parse args
program
  .version('0.1.0')
  .option('-e, --env [type]', 'which environment to use')
  .option('-r, --report', 'generate mochawesome report')
  .option('-d, --debug', 'debug')
  .parse(process.argv);

// use the .env config for our process env variables
require('dotenv').config();

// set node env
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
// grab the current dir
const currentDir = process.env.INIT_CWD || process.cwd();
// set up the wdio path
let wdioPath;
// if we're not running from npm, use init cwd
if (!process.env.INIT_CWD) {
  wdioPath = path.join(__dirname, 'e2e/config', 'wdio.conf.js');
} else {
  // npms root is the project root, so use that
  wdioPath = './e2e/config/wdio.conf.js';
}
// get the config path
const configPath = findFile(currentDir, '/config.json');
// no config? no go
if (!configPath) {
  console.error('cannot find config');
} else {
  // notify that we found a config
  console.log(`found config at ${configPath}`);
  // get the config contents
  const config = fs.readJsonSync(configPath);
  // build the test list
  const testList = [];
  // were files passed as arguments?
  if (program.args && program.args.length > 0) {
    // build the test file list
    program.args.forEach((file) => {
      testList.push(path.resolve(currentDir, file));
    });
  } else {
    console.error('must specify the file to test');
  }
  // if we found tests to run
  if (testList.length) {
    // is there a wdio in here?
    fs.access(wdioPath, fs.constants.F_OK, (err) => {
      // if there wasn't a file read error for the wdio
      if (!err) {
        // notify
        console.log('found wdio conf at ', wdioPath);
        // lets determine the baseUrl
        let baseUrl = '';
        // defined an environment?
        if (
          program.env
          && config.envs
          && config.envs[program.env]
        ) {
          const configEnvPath = config.envs[program.env];
          baseUrl = config.envs[program.env];
          if (configEnvPath.startsWith('QA_')) {
            baseUrl = process.env[configEnvPath];
          }
        } else if (config.envs && config.envs.default) {
          baseUrl = config.envs.default;
        } else if (config.baseUrl) {
          // backwards compatible
          baseUrl = config.baseUrl;
        }

        // clean baseurl so it doesn't contains any special chars.
        const cleanBaseUrl = cleanFileName(baseUrl);
        // get the base url from the config
        if (baseUrl) {
          console.log(`using base url ${baseUrl}`);
          // do custom options
          const baseOpts = {
            specs: testList,
            baseUrl,
            reporterOptions: { outputDir: `./reports/${cleanBaseUrl}` },
            services: ['selenium-standalone'],
            capabilities: [],
          };

          // if devices specifed in the domain's config, use those
          if (config.devices) {
            for (const prop in config.devices) {
              // TODO MAKE ALL DEVICES USE BROWSERSTACK LOCAL.
              baseOpts.capabilities.push(config.devices[prop]);
              // TODO: MUST ADD ERROR HANDELING FOR INVALID DEVICE PROPERTIES.
            }
          } else {
            // otherwise, default to chrome

            // set chrome settings
            const chromeSettings = {
              browser: 'Chrome',
              browserName: 'Chrome',
              // 'browserstack.local': true,
              chromeOptions: {
                args: [
                  'incognito',
                  'disable-web-security',
                ],
              },
            };

            // check config for geolocation
            if ('geolocation' in config) {
              /*
              * set geolocation preference
              * 1: enable geolocation
              * 2: disable geolocation
              */
              const geoLoc = config.geolocation ? 1 : 2;
              chromeSettings.chromeOptions.prefs = {
                'profile.default_content_setting_values.geolocation': geoLoc,
              };
            }

            // override wdio_conf with new capabilities
            baseOpts.capabilities.push(chromeSettings);
          }

          if (program.debug) {
            baseOpts.execArgv = ['--inspect-brk'];
          }

          // create a wdio inst
          const wdio = new Launcher(wdioPath, baseOpts);

          // make sure the output dir exists, do nothing if its already there
          try {
            fs.emptyDirSync(path.join(currentDir, '/reports'));
          } catch (e) {
            console.log(e, 'directory is does not exist');
          }
          // run webdriver
          wdio.run().then(async (code) => {
            // clean baseurl so it remove special chars.
            // if we passed report option then generate mochawesome report
            if (program.report) {
              const mochawesome = new MochawesomeReportGenerator(configPath, null);
              // generate mochawsome report, 'baseUrl' will be the title of the report.
              mochawesome.generateReport(baseUrl);
              // upload results to s3
              await mochawesome.uploadReport(config.business.toLowerCase(), config.project.toLowerCase(), cleanBaseUrl, getFileDateString(), `reports/${cleanBaseUrl}`);
            }
            // exit with the success/error code. not really useful for local purposes but doesn't hurt
            process.exit(code);
          }, (error) => {
            // generic webdriver launcher error
            console.error('Launcher failed to start the test', error.stacktrace);
            // exit with error code
            process.exit(1);
          });
        } else {
          console.error('Error: Missing base url in config.json');
        }
      } else {
        console.error('missing wdio.conf');
        process.exit(0);
      }
    });
  } else {
    console.error('error: no test files to run');
  }
}
/**
 * Get options for running on local box
 * @param config
 */
function getLocalOptions(config) {
  services: ['selenium-standalone']
}
/**
 * add automation browser information to wdioConfig options
 * @param config
 * @returns {void}
 */
function getAutomationOptions(options, config) {
  // clear capabilities
  options.capabilities = [];
  // lets set up the browsers
  if (config.browsers) {
    // default list
    const defaultCaps = {
      chrome: {
        browser: 'Chrome',
        browserName: 'Chrome',
        'browserstack.local': true,
      },
      firefox: {
        browser: 'Firefox',
        browserName: 'Firefox',
        'browserstack.local': true,
      },
      ie: {
        browser: 'IE',
        browserName: 'IE',
        browserVersion: '10.0',
        'browserstack.local': true,
      },
      safari: {
        browser: 'Safari',
        browserName: 'Safari',
        'browserstack.local': true,
      },
    };
    // loop
    config.browsers.forEach((browserDef) => {
      // get the capability
      const cap = defaultCaps[browserDef.name.toLowerCase()];
      // does this exist in the defaults
      if (typeof cap !== 'undefined') {
        // are there versions allowed?
        if (cap.version && browserDef.version) {
          cap.version = browserDef.version;
        }
        // push to caps
        options.capabilities.push(cap);
      } else {
        console.log(`Invalid browser ${browserDef.name}`);
      }
    });
  }
  // if the capabilities is empty, use chrome as a default
  if (!options.capabilities.length) {
    options.capabilities = [
      {
        browser: 'Chrome',
        browserName: 'Chrome',
        'browserstack.local': true,
      },
    ];
  }
}
