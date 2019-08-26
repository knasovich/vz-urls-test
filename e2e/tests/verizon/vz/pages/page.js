/**
 * Base class for all Page Objects
 */
class Page {
  /** Default constructor */
  constructor() {
    this.continueButtonSelector = '.button.primary';
  }

  /**
     * Pass in additional URL parameters required to open correct landing page and number of seconds browser should wait for page to load
     * Used to open the browser at a unique landing page and/or site experience
     * @param {string} path String of Additional URL Parameters
     * @param {number} pauseDuration Number of Seconds
     * @returns {string} URL from the browser
     */
  openBrowser(path, pauseDuration) {
    browser.url('');
    //  Set cookies to identify testing traffic to get excluded from CE reporting
    browser.setCookie({
      name: 'QA_Test_Traffic',
      value: 'true',
    }, {
      name: 'QA_Cart_Experience',
      value: 'Default-Experience',
    });

    browser.url(`/${path}`).pause(pauseDuration);
    browser.waitForVisible('body');

    const landingPageUrl = browser.getUrl();
    return (landingPageUrl);
  }
}

module.exports = Page;
