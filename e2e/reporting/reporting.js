const { uploadSlackFile, postMessage } = require('../helpers/slack_bot');
const FileHandler = require('../lib/filehandler');

/**
 * Function to run any reporting specified in automation_config for a specific domain.
 *
 * @param {String} reportType reporting method
 * @param {Array<String>} destinations output destinations
 * @param {String} filterFunction function to filter files
 * @param {String} sourceFolder folder containing run files
 * @param {Array<String>} pathList array of paths visited
 * @param {String} domain domain being reported on
 * @returns {Void}
 */
async function report(reportType, destinations, filterFunction, sourceFolder, pathList, domain) {
  // create a filehandler
  const fileHandle = new FileHandler(__dirname);
  let filesArr;
  let filter;

  // these are variables universal to all reporting types (for now), so instantiate them first
  try {
    filesArr = await fileHandle.getFiles(sourceFolder);
    filter = require(filterFunction);
  } catch (e) {
    console.log(e);
  }

  // Slack reporting
  if (reportType === 'slack') {
    // attempt slack reporting
    try {
      // filter files
      const reports = filter(filesArr);
      // for each destination, upload the data
      for (let d = 0; d < destinations.length; d++) {
        const fileUploadPromises = [];

        // loop result of filter func
        for (let r = 0; r < reports.length; r++) {
          // report files through slack
          const uploadPromise = uploadSlackFile(destinations[d], reports[r].comment, reports[r].name, reports[r].file);
          fileUploadPromises.push(uploadPromise);
        }

        // wait for all files to be uploaded to this channel before posting success message
        await Promise.all(fileUploadPromises);

        // beginning of run message
        let runMessage;
        if (fileUploadPromises.length > 0) {
          runMessage = `{ FAILING } ${domain.toUpperCase()} completed with ${fileUploadPromises.length} failures.`;
        } else {
          runMessage = `{ PASSING } ${domain.toUpperCase()} completed.`;
        }

        // post confirmation message to channels
        await postMessage(destinations[d], runMessage);
      }
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = report;
