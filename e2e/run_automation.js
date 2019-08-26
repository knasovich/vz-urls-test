const fs = require('fs-extra');
const path = require('path');
const Launcher = require('webdriverio').Launcher;
const program = require('commander');
const browserstack = require('browserstack-local');
const { findFile, cleanFileName } = require('./lib/clihelper');
const reportMochawesomeFiles = require('./reporting/mocha_report/mocha_reporting');

// parse args
program
  .version('0.1.0')
  .option('-e, --env [type]', 'which environment to use')
  .option('-f, --fileRegex [fileRegex]', 'regex to match test files you want to run')
  .option('-r, --report', 'generate mochawesome report')
  .parse(process.argv);

// use the .env config for our process env variables
require('dotenv').config();

// grab the current dir
const currentDir = process.env.INIT_CWD || process.cwd();

// get the wdio path
let wdioPath;
if (!process.env.INIT_CWD) {
  wdioPath = path.join(__dirname, 'e2e/config/', 'auto.wdio.conf.js');
} else {
  wdioPath = './e2e/config/auto.wdio.conf.js';
}

// set up blocal
const bsLocal = new browserstack.Local();

// set up key
const key = process.env.QA_BROWSERSTACK_ACCESS_KEY;

// start
bsLocal.start({ key }, (error) => {
  if (error) throw error;

  // is there a wdio in here?
  fs.access(wdioPath, fs.constants.F_OK, (err) => {
    if (!err) {
      // notify
      console.log('found wdio conf at ', wdioPath);

      // read the automation json file
      fs.readJson('./e2e/config/automation.json', (err, files) => {
        if (err) {
          throw err;
        } else {
          // keep track of how many instances we're running
          let wdioCnt = 0;

          // test files to run
          let testFilesToRun = [];

          // check for regex flag
          if (program.fileRegex) {
            // input is a string so we must create a regex from it
            const testFileRegex = new RegExp(program.fileRegex);
            // now loop through files and add matches to our array
            files.forEach((file) => {
              // we're only looking to match the actual filepath
              const filePath = file.file;
              if (filePath.match(testFileRegex)) {
                testFilesToRun.push(file);
              }
            });
          } else {
            // if no regex, just run all files
            testFilesToRun = files;
          }

          // loop files
          testFilesToRun.forEach((file) => {
            // get the config for that test file
            const configLoc = findFile(path.resolve(path.dirname(file.file), '../'), 'config.json');

            // if that file exists, continue
            fs.access(configLoc, fs.constants.F_OK, (err) => {
              if (err) {
                throw err;
              }

              console.log(`found config at ${configLoc}`);

              // read the json
              fs.readJson(configLoc, (configErr, config) => {
                if (configErr) throw configErr;

                // lets determine the baseUrl
                let baseUrl = '';
                let environment = 'default';
                // defined an environment?
                if (
                  program.env
                  && config.envs
                  && config.envs[program.env]
                ) {
                  environment = program.env;
                  const configPath = config.envs[program.env];
                  baseUrl = config.envs[program.env];
                  if (configPath.startsWith('QA_')) {
                    baseUrl = process.env[configPath];
                  }
                } else if (config.envs && config.envs.default) {
                  baseUrl = config.envs.default;
                } else if (config.baseUrl) {
                  // backwards compatible
                  baseUrl = config.baseUrl;
                }

                // get the base url from the config
                if (baseUrl) {
                  const cleanBase = baseUrl.replace(/[^a-z]/gi, '_');
                  const uploadUrlFolder = cleanFileName(baseUrl);

                  // c
                  const fileResults = /(.*)\/([a-z-_]+)\/([a-z0-9\.\-_]+)\.js/gi.exec(file.file);
                  const cleanFile = cleanFileName(file.file);
                  // do custom options
                  const baseOpts = {
                    baseUrl,
                    specs: file.file,
                    reporterOptions: { outputDir: `./reports/${cleanFile}` },
                    logLevel: 'error',
                    capabilities: [],
                  };

                  // lets set up the browsers
                  if (file.devices && config.devices) {
                    // get the devices from the config
                    const availableDevices = config.devices;

                    // loop devices in automation.json and match up with devices in biz config
                    file.devices.forEach((deviceDef) => {
                      // get the capability
                      const cap = availableDevices[deviceDef.name];

                      // does this exist in the config
                      if (typeof cap !== 'undefined') {
                        // make all devices run using browserstack.local
                        cap['browserstack.local'] = true;

                        console.log(`Running device ${deviceDef.name}`);

                        // push to capabilities
                        baseOpts.capabilities.push(cap);
                      } else {
                        console.log(`Invalid device ${deviceDef.name}`);
                      }
                    });
                  }

                  // if the capabilities is empty, use chrome as a default
                  if (!baseOpts.capabilities.length) {
                    baseOpts.capabilities = [
                      {
                        browser: 'Chrome',
                        browserName: 'Chrome',
                        'browserstack.local': true,
                      },
                    ];
                  }

                  // add bstackclocal params
                  baseOpts.services = ['browserstack'];
                  baseOpts.host = 'hub.browserstack.com';
                  baseOpts.user = process.env.QA_BROWSERSTACK_USERNAME;
                  baseOpts.key = process.env.QA_BROWSERSTACK_ACCESS_KEY;

                  console.log('running wdio');

                  // create a wdio inst
                  const wdio = new Launcher(wdioPath, baseOpts);

                  // make sure the output dir exists, do nothing if its already there
                  try {
                    fs.emptyDirSync(path.join(currentDir, '/output'));
                  } catch (e) {
                    console.log(e);
                  }

                  console.log(baseOpts.baseUrl);

                  // run wdio
                  wdio.run()
                    .then(() => {
                      // increment the number of tests running

                      // are we generating a report?
                      if (program.report) {
                        reportMochawesomeFiles(cleanFile, file.file, config.business, config.project, environment, file.slackChannels, baseOpts.capabilities, `reports/${cleanFile}`);
                        // keep count of how many files we're going thru
                        wdioCnt = files.length - 1;
                      }

                      // wait till everything is done
                      if (wdioCnt === 0) {
                        console.log('done');
                        // stop bs local
                        bsLocal.stop(() => { });

                        // exports.bs_local.stop(() => {});

                        // force exit so jenkins doesn't complain
                        process.exit(0);
                      }
                    });
                }
              });
            });
          });
        }
      });
    }
  });
});
