const fs = require('fs-extra');
const path = require('path');
const { cleanFileName, getFileDateString } = require('../../lib/clihelper');
const MochawesomeReportGenerator = require('./mocha_report_gen');
const { postFormattedMessage } = require('../../helpers/slack_bot');

/**
 * Helper for creating readable device text.
 *
 * @param {Array} devices - devices run
 * @returns {Array}
 */
function generateDeviceText(devices) {
  let deviceMessage;
  const deviceTexts = [];

  // construct a readable string for each device
  devices.forEach((device) => {
    let deviceText = '';
    if (device.browserName) {
      deviceText = `${deviceText}${device.browserName}`;
    }
    if (device.os) {
      deviceText = `${deviceText} on ${device.os}`;
    }
    if (device.os_version) {
      deviceText = `${deviceText} ${device.os_version}`;
    }
    // deviceTexts.push(deviceText);
    deviceTexts.push(deviceText);
    // deviceTexts.push('safari on iOS 11');
  });

  // now let's format these strings in a readable message
  for (let i = 0; i < deviceTexts.length; i++) {
    if (deviceMessage) {
      deviceMessage = `\n${deviceMessage},\n${deviceTexts[i]},`;
    } else {
      deviceMessage = deviceTexts[i];
    }
  }

  return deviceMessage;
}

module.exports = async function reportMochawesomeFiles(testUrl, testFile, business, domain, environment, channels, devicesRun, uploadDir) {
  const mochawesome = new MochawesomeReportGenerator();

  // generate mochawsome report, 'config.project' will be the title of the report.
  console.log('Generating report...');
  mochawesome.generateReport(testUrl);
  console.log('Generated report');

  // upload report to S3
  console.log('Uploading report...');
  await mochawesome.uploadReport(business.toLowerCase(), domain.toLowerCase(), environment, getFileDateString(), uploadDir);
  console.log('Uploaded report');

  // get report url
  const reportUrl = mochawesome.getReportUrl();

  const cleanUrl = cleanFileName(testUrl);
  const mochaJsonPath = path.join(__dirname, `../../../reports/${cleanUrl}/mochawesome.json`);

  // construct message
  console.log('Reading report...');
  const mochaJson = fs.readJsonSync(mochaJsonPath);
  console.log('Read report');

  const totalTests = mochaJson.stats.tests;
  const failing = mochaJson.stats.failures;
  const time = mochaJson.stats.duration / 1000;
  const header = 'Mocha Test Report';
  const testName = path.basename(testFile);
  const results = `${failing}/${totalTests}`;
  const deviceText = generateDeviceText(devicesRun);

  // "failing" contains number of tests that failed. Can use to decide whether to send notification to Slack!
  if (failing === 0) {
    return;
  }

  const slackFormatting = {
    text: `*${header}*\n*Domain:* ${domain}\n*Test:* ${testName}\n*Results:*`,
    attachments: [
      {
        text: `*Failures:* ${results}`,
      },
      {
        text: `*Duration:* ${time} seconds`,
      },
      {
        text: `*Devices:* ${deviceText}`,
      },
      {
        fallback: `*Detailed Report:* ${reportUrl}`,
        actions: [
          {
            type: "button",
            text: "Detailed Report",
            url: reportUrl,
          },
        ],
      },
    ],
  };

  console.log(channels);
  // upload to slack
  for (let c = 0; c < channels.length; c++) {
    console.log(`Posting message to channel '${channels[c]}'...`);
    postFormattedMessage(channels[c], slackFormatting);
    console.log(`Posted message to channel '${channels[c]}'!`);
  }
};
