const Page = require('./page');

/**
 * Page object for Home page
 */
class HomePage extends Page {
  /** Default constructor */
  constructor() {
    super();
    this.checkAvailabilityButtonSelector = '//a[contains(text(), "Check Availability")]';
  }

  /**
   * Clicks Check Availability button
   * @returns {void}
   */
  openAddressChecker() {
    browser.waitForVisible(this.checkAvailabilityButtonSelector, 30000);
    $(this.checkAvailabilityButtonSelector).click();
  }
}

module.exports = new HomePage();
