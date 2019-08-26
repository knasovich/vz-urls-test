const execSync = require('child_process').execSync;
const S3 = require('../../lib/s3_handler');
const path = require('path');
const { cleanFileName } = require('../../lib/clihelper');
const bucketName = 'rv-qa-engineering-artifacts/rv-qa-engineering-artifacts';
let s3Key = '';
/**
 * This class holds the logic to generate mochawesome report.
 * It will also allow us to upload our results into s3.
 */
class MochawesomeReportGenerator {
  /**
   * @param {*} configPath the project we're generating the report from
   * @param {*} slackChannels slack channel we want to notify
   */
  constructor(configPath, slackChannels) {
    this.configPath = configPath;
    this.slackChannels = slackChannels;
  }

  /**
   * This is a wrapper function to upload our mochawesome report.
   * This leverage the uploadResultsFolder from the s3_handler class.
   * @param {string} business the name of the business
   * @param {string} domain the name of the sub-domain, ex. amex > cch
   * @param {string} environment the run environment for the uploaded files (qa, pre-prod, prod, etc.)
   * @param {string} timestamp the timestamp for the uploaded files
   * @param {string} dirToUpload the local directory we want to upload to s3
   * @param {string} s3ResultsPath the path in which we store in s3.
   * @returns {array} uploaded files [array]
   */
  async uploadReport(business, domain, environment, timestamp, dirToUpload, s3ResultsPath = 'mochawesome_reports') {
    // setup our s3 bucket
    console.log('In s3.uploadReport method!');
    const s3upload = new S3(business);
    // grab the s3 path, we'll use this to get the object url for slack reporting
    s3Key = path.join(business, 'mochawesome_reports', domain, environment, timestamp, 'mochawesome_report.html');
    // run the uploadResultsFolder function
    return s3upload.uploadResultsFolder(domain, environment, timestamp, dirToUpload, s3ResultsPath);
  }

  /**
   * wrapper function to give us the key for slack reporting
   * @returns {string}
   */
  getReportUrl() {
    return S3.getS3FileUrl(s3Key, bucketName);
  }

  /**
   * This function will generate the mochawesome report
   * We will use testUrl as our report title without formatting it.
   * @param {string} testUrl title of the report as well as folder name for html file
   * @return {void}
   */
  generateReport(testUrl) {
    try {
      // format our testUrl, replacing ":", "/" with "_"
      // this is done so that doesn't accidentally create
      // a new directory because it reads "/" as a new path
      // stdio will capture standard out/in/error.
      const cleanUrl = cleanFileName(testUrl);
      execSync(`marge ./reports/${cleanUrl}/mochawesome.json -o ./reports/${cleanUrl}/ -f 'mochawesome_report' --reportTitle ${testUrl}`,
        { stdio: [process.stdin, process.stdout, process.stderr] });
    } catch (err) {
      console.log('Unable to generate mochawesome report.');
      console.log(err);
    }
  }
}

module.exports = MochawesomeReportGenerator;
