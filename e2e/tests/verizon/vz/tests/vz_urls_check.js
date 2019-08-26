const { expect } = require('chai');
const homePage = require('../pages/home_page');
const testData = require('../test_data/test_data');


describe('VZ: Parameters verification on brand and non brand sites', () => {
  describe('Redirect from Promotions page - brand site', () => {
    it.only('Should verify url params - redirect from Promotions page', () => {
      homePage.openBrowser(testData.promotionsBrandPage.path);
      if (browser.isVisible(testData.promotionsBrandPage.popupCloseIconSelector)) {
        $(testData.promotionsBrandPage.popupCloseIconSelector).click();
      }
      browser.waitForVisible(testData.promotionsBrandPage.buttonSelector, 20000);
      $(testData.promotionsBrandPage.buttonSelector).click();
      expect(browser.getUrl()).to.contain(testData.promotionsBrandPage.cValue,
        `\n \n URL does not contain correct parameter and value: $ "${testData.promotionsBrandPage.cValue}". \n \n`);
      expect(browser.getUrl()).to.contain(testData.promotionsBrandPage.abrValue,
        `\n \n URL does not contain correct parameter and value: $ "${testData.promotionsBrandPage.abrValue}". \n \n`);
    });
  });
  describe('Redirect from Why Fios page - brand site', () => {
    it('Should verify url params - redirect from Why Fios page', () => {
      homePage.openBrowser(testData.whyFiosBrandPage.path);
      if (browser.isVisible(testData.promotionsBrandPage.popupCloseIconSelector)) {
        $(testData.promotionsBrandPage.popupCloseIconSelector).click();
      }
      browser.waitForVisible(testData.whyFiosBrandPage.buttonSelector, 20000);
      $(testData.whyFiosBrandPage.buttonSelector).click();
      expect(browser.getUrl()).to.contain(testData.whyFiosBrandPage.cValue,
        `\n \n URL does not contain correct parameter and value: $ "${testData.whyFiosBrandPage.cValue}". \n \n`);
      expect(browser.getUrl()).to.contain(testData.whyFiosBrandPage.abrValue,
        `\n \n URL does not contain correct parameter and value: $ "${testData.whyFiosBrandPage.abrValue}". \n \n`);
    });
  });
  describe('Redirect from Plans page - brand site - Popular', () => {
    it('Should verify url params - redirect from Plans page', () => {
      homePage.openBrowser(testData.plansBrandPage.path);
      if (browser.isVisible(testData.promotionsBrandPage.popupCloseIconSelector)) {
        $(testData.promotionsBrandPage.popupCloseIconSelector).click();
      }
      browser.waitForVisible(testData.promotionsBrandPage.buttonSelector, 20000);
      let elements = $$(testData.plansBrandPage.buttonsSelector);
      for (let i = 0; i < elements.length; i++) {
        elements = $$(testData.plansBrandPage.buttonsSelector);
        elements[i].click();
        expect(browser.getUrl()).to.contain(testData.plansBrandPage.cValue,
          `\n \n URL does not contain correct parameter and value: $ "${testData.plansBrandPage.cValue}". \n \n`);
        expect(browser.getUrl()).to.contain(testData.plansBrandPage.abrValue,
          `\n \n URL does not contain correct parameter and value: $ "${testData.plansBrandPage.abrValue}". \n \n`);
        browser.back();
        browser.pause(2000);
      }
    });
  });
  describe('Redirect from Plans page - brand site - Internet Only', () => {
    it('Should verify url params - redirect from Plans page', () => {
      homePage.openBrowser(testData.plansBrandPageInternetOnly.path);
      if (browser.isVisible(testData.promotionsBrandPage.popupCloseIconSelector)) {
        $(testData.promotionsBrandPage.popupCloseIconSelector).click();
      }
      browser.pause(2000);
      //browser.waitForVisible(testData.promotionsBrandPage.buttonSelector, 20000);
      let elements = $$(testData.plansBrandPageInternetOnly.buttonsSelector);
      for (let i = 0; i < elements.length; i++) {
        elements = $$(testData.plansBrandPageInternetOnly.buttonsSelector);
        elements[i].click();
        expect(browser.getUrl()).to.contain(testData.plansBrandPageInternetOnly.cValue,
          `\n \n URL does not contain correct parameter and value: $ "${testData.plansBrandPageInternetOnly.cValue}". \n \n`);
        expect(browser.getUrl()).to.contain(testData.plansBrandPageInternetOnly.abrValue,
          `\n \n URL does not contain correct parameter and value: $ "${testData.plansBrandPageInternetOnly.abrValue}". \n \n`);
        browser.back();
        browser.pause(2000);
      }
    });
  });
  describe('Redirect from Promotions page - non brand site', () => {
    it('Should verify url params - redirect from Promotions page', () => {
      browser.pause(2000);
      homePage.openBrowser(testData.promotionsNonBrandPage.path);
      if (browser.isVisible(testData.promotionsBrandPage.popupCloseIconSelector)) {
        $(testData.promotionsBrandPage.popupCloseIconSelector).click();
      }
      browser.waitForVisible(testData.promotionsNonBrandPage.buttonSelector, 20000);
      $(testData.promotionsNonBrandPage.buttonSelector).click();
      expect(browser.getUrl()).to.contain(testData.promotionsNonBrandPage.cValue,
        `\n \n URL does not contain correct parameter and value: $ "${testData.promotionsNonBrandPage.cValue}". \n \n`);
      expect(browser.getUrl()).to.contain(testData.promotionsBrandPage.abrValue,
        `\n \n URL does not contain correct parameter and value: $ "${testData.promotionsNonBrandPage.abrValue}". \n \n`);
    });
  });
  describe('Redirect from Why Fios page - non brand site', () => {
    it('Should verify url params - redirect from Why Fios page', () => {
      homePage.openBrowser(testData.whyFiosNonBrandPage.path);
      if (browser.isVisible(testData.promotionsBrandPage.popupCloseIconSelector)) {
        $(testData.promotionsBrandPage.popupCloseIconSelector).click();
      }
      browser.waitForVisible(testData.whyFiosNonBrandPage.buttonSelector, 20000);
      $(testData.whyFiosNonBrandPage.buttonSelector).click();
      expect(browser.getUrl()).to.contain(testData.whyFiosNonBrandPage.cValue,
        `\n \n URL does not contain correct parameter and value: $ "${testData.whyFiosNonBrandPage.cValue}". \n \n`);
      expect(browser.getUrl()).to.contain(testData.whyFiosNonBrandPage.abrValue,
        `\n \n URL does not contain correct parameter and value: $ "${testData.whyFiosNonBrandPage.abrValue}". \n \n`);
    });
  });
  describe('Redirect from Plans page - non brand site - Popular', () => {
    it('Should verify url params - redirect from Plans page', () => {
      homePage.openBrowser(testData.plansNonBrandPage.path);
      browser.waitForVisible(testData.promotionsNonBrandPage.buttonSelector, 20000);
      if (browser.isVisible(testData.promotionsBrandPage.popupCloseIconSelector)) {
        $(testData.promotionsBrandPage.popupCloseIconSelector).click();
      }
      let elements = $$(testData.plansNonBrandPage.buttonsSelector);
      for (let i = 0; i < elements.length; i++) {
        elements = $$(testData.plansNonBrandPage.buttonsSelector);
        elements[i].click();
        expect(browser.getUrl()).to.contain(testData.plansNonBrandPage.cValue,
          `\n \n URL does not contain correct parameter and value: $ "${testData.plansNonBrandPage.cValue}". \n \n`);
        expect(browser.getUrl()).to.contain(testData.plansNonBrandPage.abrValue,
          `\n \n URL does not contain correct parameter and value: $ "${testData.plansNonBrandPage.abrValue}". \n \n`);
        browser.back();
        browser.pause(2000);
      }
    });
  });
  describe('Redirect from Plans page - non brand site - Internet Only', () => {
    it('Should verify url params - redirect from Plans page', () => {
      homePage.openBrowser(testData.plansNonBrandPageInternetOnly.path);
      browser.waitForVisible(testData.promotionsNonBrandPage.buttonSelector, 20000);
      if (browser.isVisible(testData.promotionsBrandPage.popupCloseIconSelector)) {
        $(testData.promotionsBrandPage.popupCloseIconSelector).click();
      }
      let elements = $$(testData.plansNonBrandPageInternetOnly.buttonsSelector);
      for (let i = 0; i < elements.length; i++) {
        elements = $$(testData.plansNonBrandPageInternetOnly.buttonsSelector);
        elements[i].click();
        expect(browser.getUrl()).to.contain(testData.plansNonBrandPageInternetOnly.cValue,
          `\n \n URL does not contain correct parameter and value: $ "${testData.plansNonBrandPageInternetOnly.cValue}". \n \n`);
        expect(browser.getUrl()).to.contain(testData.plansNonBrandPageInternetOnly.abrValue,
          `\n \n URL does not contain correct parameter and value: $ "${testData.plansNonBrandPageInternetOnly.abrValue}". \n \n`);
        browser.back();
        browser.pause(2000);
      }
    });
  });
});
