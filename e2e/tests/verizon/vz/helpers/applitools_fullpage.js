/* eslint-disable require-jsdoc */

// eyes class - main methods used to execute tests and checkpoints
// target class - methods used to define and configure the target for the check method
const { Eyes, Target } = require('@applitools/eyes.webdriverio');
const applitoolsBatchName = require('./applitoolsBatchNames.js');

const serverURL = 'https://redventureseyesapi.applitools.com';
const eyes = new Eyes(serverURL);
const batchName = applitoolsBatchName.batchNameProject.fullPageScreenshots.hughesnetDesktopFullPage;
eyes.setBatch(batchName);
// our api key for applitools
// eyes.setApiKey(process.env.QA_APPLITOOLS_KEY);
eyes.setApiKey('97OcWhDs4105Vea54IlN3sy8Fkla78S110Swmf1yn700Muho110');
// method to set whether or not Eyes does scrolling and stitching on scrolled pages
eyes.setForceFullPageScreenshot(true);
// method to set whether or not Eyes hides the scrollbars before capturing screenshots
eyes.setHideScrollbars(true);
// prevents the page from capturing elements in it's viewport while scrolling in force-to fullscreen mode i.e sticky navigation or filo
// eyes.setStitchMode('CSS');

// const Homepage = require('../../ccae_desktop/pages/page');

// const globalHomepage = new Homepage();

const { baseUrl } = browser.options;

function runApplitoolsFullScreen(path) {
  describe('Full Page Screenshots', () => {
    it(`should capture full page screenshot for '${path}'`, async () => {
      browser.url(baseUrl + path);

      // navigate to the url
      // globalHomepage.hidePreamp(browser);

      try {
      // store the title of the page
        const pageTitle = browser.getTitle();
        console.log(`Title of the page is ${pageTitle}!`);

        // setting the view port size and passing in into the open method
        const viewportSize = browser.windowHandleSize({
          width: 1200,
          height: 953,
        }).value;

        // method to start a test, before calling any of the check methods
        await eyes.open(browser, pageTitle, `${path}`, viewportSize);

        // Visual Checkpoint 1 - configure check to match the entire window
        await eyes.check('Full Page', Target.window().strict());

        await eyes.close();
      } finally {
        await eyes.abortIfNotClosed();
      }
    });
  });
}
module.exports = runApplitoolsFullScreen;
