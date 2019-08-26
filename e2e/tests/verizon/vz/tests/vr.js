const { Eyes, Target, StitchMode } = require('@applitools/eyes.webdriverio');
const homePage = require('../pages/home_page');

const serverURL = 'https://redventureseyesapi.applitools.com';
const eyes = new Eyes(serverURL);
eyes.setApiKey('97OcWhDs4105Vea54IlN3sy8Fkla78S110Swmf1yn700Muho110');
eyes.setForceFullPageScreenshot(true);
eyes.setStitchMode(StitchMode.CSS);
// eyes.setHideScrollbars(true);

const tests = [
  {
    name: 'Promotions - Brand',
    path: 'home/rb/promotions',
  },
  {
    name: 'Why FiOS - Brand',
    path: 'home/rb/why-fios',
  },
];

describe('Verizon VR', () => {
  describe('VZ-brand: "promotions" page', () => {
    tests.forEach(test => it(`Should navigate to "${test.name}" page (${test.path}) and take a screenshot`, async () => {
      await eyes.open(browser, 'Verizon', 'Visual Regression Testion - VZ');
      homePage.openBrowser(test.path);
      await eyes.check(test.name, Target.window().strict());
      await eyes.close();
    }));

    // it.only('Should navigate to https://www.verizon.com/home/rb/promotions and take a screenshot', async () => {
    // // Initialize ApplitTools Eyes object to our application and test
    //   await eyes.open(browser, 'Verizon', 'Visual Regression Testion - VZ');
    //   homePage.openBrowser('home/rb/why-fios');
    //   //browser.pause(4000);
    //   //homePage.openBrowser('', 2000);
    //   // Check promotions page
    //   await eyes.check('Promotions Page', Target.window().strict());
    //   await eyes.close();
    // });
  });
//   describe('VZ-brand: "why fios" page', () => {
//     it('Should navigate to https://www.verizon.com/home/rb/why-fios and take a screenshot', async () => {
//       await eyes.open(browser, 'Verizon', 'Visual Regression Testion - VZ');
//       homePage.openBrowser('', 2000);
//       // Check why fios page
//       await eyes.check('Why Fios Page', Target.window().strict());
//       await eyes.close();
//     });
//   });
// describe('HughesNet VR', () => {
//   it('Should navigate to internet.hughesnet.com/mobile', async () => {
//     // Initialize ApplitTools Eyes object to our application and test
//     await eyes.open(browser, 'HughesNet', 'Basic VR');

//     homePage.openBrowser('', 2000);
//     // Check Home Page
//     await eyes.check('Landing Page', Target.window().strict());

//     await eyes.close();
//   });
// });
});
