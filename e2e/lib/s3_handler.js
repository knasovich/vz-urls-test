const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const klaw = require('klaw');
const FileHandler = require('./filehandler');

const { cleanFileName, getFileDateString, getTimeFromFormatString, getUploadDirectory } = require('./clihelper');

// hardcode default bucket for now
const defaultBucket = 'rv-qa-engineering-artifacts';

/**
 * handles interaction of files with AWS s3
 */
class S3Handler {
  /**
   * Creates an instance of the s3Handler
   * @param {string} project The name of the project this handler will use.
   * @param {string} bucketName The name of the bucket this handler will use.
   * @returns {object} Returns an instance of the s3Handler
   */
  constructor(project, bucketName) {
    // must pass a valid project
    if (!project) {
      throw new Error('must pass a valid project');
    }

    // Create a new instance of AWS S3.
    this.s3 = new AWS.S3();

    // set em up
    this.project = cleanFileName(project);
    this.bucketName = bucketName || defaultBucket;
    this.dateStr = getFileDateString();
  }

  /**
  * Get the project path.
  * @returns {string}
  */
  get projectPath() {
    return path.join(this.bucketName, this.project);
  }

  /**
   * Get the bucket name.
   * @returns {string}
   */
  getBucketName() {
    return this.bucketName;
  }

  /**
  * get a new crawl dir formatted correctly
  * @param {string} domain The business domain to get formatted crawl dir for.
  * @returns {string}
  */
  getNewCrawlFilePath(domain) {
    // clean up the domain name first
    const cleanDomainName = cleanFileName(domain);

    // generate a date and timestamp thats folder friendly
    const dateStr = getFileDateString();

    // return the path
    return path.join(this.projectPath, 'crawls', cleanDomainName, `${dateStr}.json`);
  }

  /**
   * Sets the s3 service instance for the s3_handler.
   * @param {object} s3Instance The s3 instance to set for the s3 helper class.
   * @returns {void}
   */
  setS3Instance(s3Instance) {
    this.s3 = s3Instance;
  }

  /**
   * Upload a screenshot to s3
   * @param {string} url The domain url path the screenshot corresponds to.
   * @param {string} pathName The path on the domain the screenshot corresponds to.
   * @param {object} snapData An object containing the snap data.
   * @param {string} dateStr The date when the screenshot was taken.
   * @returns {void}
   */
  uploadSnap(url, pathName, snapData, dateStr) {
    // use the default date string?
    const fileDate = dateStr || this.dateStr;

    // clean up
    const fileName = path.join(this.projectPath, 'snaps', `${cleanFileName(url)}`, fileDate, `${cleanFileName(pathName)}.png`);

    // push
    this.push(fileName, snapData);
  }

  /**
   * Upload Crawl results to s3
   * @param {string} domain The business domain.
   * @param {object} data An object containing the crawl data.
   * @returns {*}
   */
  uploadCrawlData(domain, data) {
    // get the path
    const crawlPath = this.getNewCrawlFilePath(domain);

    // upload
    return this.push(crawlPath, JSON.stringify(data));
  }

  /**
   * upload a diff image to s3
   * @param {string} from The filename for the source image to compare with.
   * @param {string} to The filename for the target image to compare against.
   * @param {string} pathName The filename for the resulting diff image.
   * @param {object} diffData The resulting diff data.
   * @param {string} dateStr The date string for the diff file.
   * @returns {string}
   */
  uploadDiff(from, to, pathName, diffData, dateStr) {
    // use the default date string?
    const fileDate = dateStr || this.dateStr;

    // clean up
    const fileName = path.join(this.projectPath, 'diffs', `${cleanFileName(from)}_vs_${cleanFileName(to)}`, fileDate, `${cleanFileName(pathName)}.png`);

    // push
    this.push(fileName, diffData);
  }

  /**
   * upload diff results json to s3
   * @param {string} from The filename for the source content data to compare with.
   * @param {string} to The filename for the target content data to compare against.
   * @param {object} diffData The resulting content diff data.
   * @param {string} dateStr The date string for the content diff.
   * @returns {string}
   */
  uploadDiffResults(from, to, diffData, dateStr) {
    // use the default date string?
    const fileDate = dateStr || this.dateStr;

    // clean up
    const fileName = path.join(this.projectPath, 'diffs', `${cleanFileName(from)}_vs_${cleanFileName(to)}`, fileDate, 'conflicts.json');

    // push
    this.push(fileName, JSON.stringify(diffData));
  }

  /**
   * push contents to s3
   * @param {string} filepath The filepath for the file to upload.
   * @param {object} fileContents The contents of the file to upload.
   * @param {string} type The type of the file to upload.
   * @returns {string}
   */
  push(filepath, fileContents, type = 'image/png') {
    const pushData = {
      Bucket: this.bucketName,
      Key: filepath,
      Body: fileContents,
      ContentEncoding: type,
      ContentType: type,
    };

    // Upload our file(s) to our S3 bucket.
    // The function putObject() takes a parameter and upload the file based on what
    // we have specified in pushData. It return and error if it wasn't able to read the file.
    // Else it would successfully upload our file(s).
    this.s3.putObject(pushData, (er) => {
      if (er) {
        throw new Error(`ERROR: ${er}`);
      }
    });
  }

  /**
   * Get the file type so we can set it as the metadata
   * we upload our files instead of application/octet-stream
   * @param {string} fileName the file we're uploading
   * @returns {string}
   */
  getContentTypeByFile(fileName) {
    let type = 'application/octet-stream';

    const fileExtension = ['.html', '.css', '.json', '.woff2', '.woff', '.js', '.png', '.jpg'];
    const metadata = ['text/html', 'text/css', 'application/json', 'binary/ocet-stream',
      'application/font-woff', 'application/x-javascript', 'image/png', 'image/jpg'];

    for (let i = 0; i < fileExtension.length; i++) {
      if (fileName.indexOf(fileExtension[i]) >= 0) {
        type = metadata[i];
        return type;
      }
    }
    return type;
  }

  /**
   * upload a results folder for the specified project and domain
   *
   * @param {string} filePath - the local file path
   * @param {string} bucketPath - the remote bucket path
   * @param {string} rootDir - the local root dir for this file
   * @returns {promise}
   */
  async uploadLocalFile(filePath, bucketPath, rootDir = '') {
    return new Promise((resolve) => {
      const fileHandler = new FileHandler(path.join(__dirname, '/..'));

      // pull resultsLoc from FileHandler
      const resultsLoc = !rootDir ? fileHandler.outputDir : rootDir;
      // get the content-type of the file to be used in our put object
      const metaData = this.getContentTypeByFile(filePath);

      fs.readFile(filePath)
        .then((fileContents) => {
          const uploadLoc = path.join(bucketPath, filePath.replace(resultsLoc, ''));

          const putObjectParams = {
            Bucket: this.bucketName,
            Key: uploadLoc,
            Body: fileContents,
            ContentType: metaData,
          };
          // upload the promise to s3
          const putObjectPromise = this.s3.putObject(putObjectParams).promise();
          resolve(putObjectPromise);
        })
        .catch((err) => {
          throw new Error(`Failed to up file '${filePath}' to bucket path '${bucketPath}': ${err}`);
        });
    });
  }

  /**
   * upload a results folder for the specified project and asset
   * @param {string} domain the domain of the business
   * @param {string} environment The run environment for the uploaded files
   * @param {string} timestamp The timestamp for the uploaded files
   * @param {string} dirToUpload The directory to upload to s3
   * @param {string} s3ResultsPath the s3 path that is upload to aws
   * @returns {array} uploadedFiles [array]
   */
  async uploadResultsFolder(domain, environment, timestamp = getFileDateString(), dirToUpload, s3ResultsPath) {
    return new Promise((resolve, reject) => {
      // create a list of files
      const files = [];

      // create a array for upload promises
      const uploadPromises = [];

      // create a list of uploaded files
      const uploadedFiles = [];

      // set the dir temporarily
      const currentDir = process.env.INIT_CWD || process.cwd();
      const resultsLoc = getUploadDirectory(currentDir, dirToUpload);

      // start walking
      klaw(resultsLoc)
        .on('error', (err) => {
          reject(err);
        }) // forward the error on
        .on('data', item => files.push(item.path))
        .on('end', () => {
          // set up bucket path
          const bucketPath = path.join(this.projectPath, s3ResultsPath, domain, environment, timestamp);
          // for each file in the directory
          for (let x = 0; x < files.length; x++) {
            // make things easier
            const fileName = files[x];

            // ignore if this is a directory, or mac metadata
            if (fs.lstatSync(fileName).isDirectory() || fileName.includes('.DS_Store')) {
              continue;
            }

            const uploadPromise = this.uploadLocalFile(fileName, bucketPath, resultsLoc);
            uploadPromises.push(uploadPromise);
          }

          // wait for all files to finish uploading; and return the list of uploaded file paths
          Promise.all(uploadPromises)
            .then((results) => {
              if (results) {
                results.forEach((result) => {
                  if (result.Key) {
                    uploadedFiles.push(result.Key);
                  }
                });
              }
              resolve(uploadedFiles);
            })
            .catch((error) => {
              console.log(error);
            });
        });
    });
  }

  /**
   * Retrieves s3 artifacts.
   * @param {string} folderPath The s3 folder path to retrieve artifacts from.
   * @param {date} startAfter The date object specifying the minimum creation threshold for s3 object retrieval.
   * @returns {Promise} Promise object resolves to a set of s3 artifacts.
   */
  async getS3Objects(folderPath, startAfter) {
    const opts = {
      Bucket: this.bucketName,
      Prefix: folderPath,
      MaxKeys: 1000,
    };

    if (startAfter) {
      opts.StartAfter = startAfter;
    }

    return new Promise(async (resolve, reject) => {
      // grab the objects at this location
      this.s3.listObjectsV2(opts, (err, res) => {
        if (err) {
          return reject(err);
        }

        return resolve(res);
      });
    });
  }

  /**
   * Return the complete contents of an S3Object lis
   * @param {string} folderPath The s3 folder path.
   * @param {string} startAfter The file to start the retrieval after.
   * @returns {string}
   */
  async getCompleteS3ObjectList(folderPath, startAfter = '') {
    let items = [];

    // grab the objects at this location
    let results = await this.getS3Objects(folderPath, startAfter);

    items = items.concat(results.Contents);

    // any more to get?
    while (results.IsTruncated) {
      const startAfterTruncation = results.Contents[results.Contents.length - 1].Key;
      // we can't make these requests asynchronous because the next call is depended
      results = await this.getS3Objects(folderPath, startAfterTruncation); // eslint-disable-line no-await-in-loop

      items = items.concat(results.Contents);
    }
    return items;
  }

  /**
   * Get data for a particualar business domain in s3.
   * @param {string} domainName The business domain.
   * @param {*} environment The test environment.
   * @param {*} secondsBack The total seconds in the past from the current date which files should be retrived.
   * @param {*} referenceDate The date from which files should be retrieved.
   * @returns {Promise} The resulting list of files, or false if no files are found.
   */
  async getDomainData(domainName, environment, secondsBack, referenceDate) {
    // set up date format string
    let formatString;
    let dateStr;

    // no date helper, just get the most recent
    if (!secondsBack && !referenceDate) {
      // empty date
      dateStr = '';
    } else if (secondsBack && !referenceDate) { // seconds back? use that to determine the formatString
      // determine the days back date string
      const folderDate = moment().subtract(secondsBack, 'seconds');

      // set up the format string
      formatString = 'MM_DD_YY';

      // get how much time ago this value is
      const timeAgo = folderDate.fromNow();

      // hours?
      if (timeAgo.includes('hour')) {
        formatString += '_h';
      } else if (timeAgo.includes('minute')) {
        formatString += '_h_mm';
      } else if (timeAgo.includes('second')) {
        formatString += '_h_mm_ss';
      }
    } else if (referenceDate) {
      dateStr = referenceDate;
    } else {
      formatString = referenceDate;
    }

    // no string? no go
    if (typeof dateStr === 'undefined') {
      if (!formatString) {
        return Promise.reject(new Error('invalid date reference'));
      }

      // we haven't gotten a date already. use the formatString to make one
      dateStr = moment().format(formatString);
    }

    // set up s3 the folder path
    const folderPath = path.join(this.projectPath, 'results', domainName, environment, dateStr);

    // list folders
    return new Promise(async (resolve) => {
      // create items Array
      let items = [];

      // grab the objects at this location
      let results = await this.getS3Objects(folderPath);

      items = items.concat(results.Contents);

      // any more to get?
      while (results.IsTruncated) {
        const startAfter = results.Contents[results.Contents.length - 1].Key;
        results = await this.getS3Objects(folderPath, startAfter);

        items = items.concat(results.Contents);
      }

      // create a list to store found dates
      let dateList = [];

      // loop the results
      items.forEach((item) => {
        // get the date from the result
        const split = item.Key.match(/(.*?)(([0-9_]+)_(am|pm))(.*)/i);

        // if we found a date, add to the list
        dateList.push(split[2]);
      });

      // return false if nothing found
      if (!dateList.length) {
        return resolve(false);
      }

      // clean up the list to remove duplicates
      // sort by the most recent
      dateList = dateList.filter((date, position) => dateList.indexOf(date) === position)
        .sort((itemA, itemB) => {
          // get the timestamps
          const timestampA = getTimeFromFormatString(itemA);
          const timestampB = getTimeFromFormatString(itemB);

          if (timestampA > timestampB) {
            return -1;
          }
          return 1;
        });

      // get the most recent
      const dateSeed = dateList[0];

      // get only the items that have that date
      const matchedResults = items.filter(item => item.Key.includes(dateSeed));

      // return
      resolve(matchedResults);
    });
  }

  /**
   * Download the given files from s3
   * @param {array} fileList The list of files to download from s3.
   * @param {string} outputPath The local path to download files to.
   * @returns {Promise<any>}
   */
  downloadReferenceResultsFromList(fileList, outputPath) {
    // create filehandler
    const fileHandle = new FileHandler(outputPath);

    // make sure the folder is empty
    fileHandle.clearReferenceResults();

    // get the file
    return new Promise((res, rej) => {
      // create a promise array
      const promArray = [];

      // loop
      for (let x = 0; x < fileList.length; x++) {
        const file = fileList[x];

        console.log(`downloading ${file.Key}`);

        const prom = new Promise((resolve, reject) => {
          // get from s3
          const dataStream = this.s3.getObject({
            Bucket: this.bucketName,
            Key: file.Key,
          }).createReadStream();

          // split up the name to get the location
          const split = file.Key.match(/(.*?)([0-9]{2}_(am|pm))(.*)/i);

          if (split[4]) {
            // get the final location filename for this file
            const name = fileHandle.getReferenceFilename(split[4]);

            // create a write stream
            const writeStream = fs.createWriteStream(name)
              .on('finish', () => {
                console.log(`downloaded ${file.Key}`);
                resolve();
              });

            // write
            dataStream.pipe(writeStream);
          } else {
            console.log(`misconfigured file name for download (${file.Key})`);
            reject();
          }
        });

        // add the promise to the array
        promArray.push(prom);
      }

      // when done, resolve
      Promise.all(promArray)
        .then(() => {
          res();
        })
        .catch((e) => {
          rej(e);
        });
    });
  }

  /**
   * Generates the s3 artifact url
   * @param {string} key The s3 artifact key,
   * @param {string} bucketName The name of the bucket the s3 artifact resides in.
   * @returns {string}
   */
  static getS3FileUrl(key, bucketName) {
    // TODO: not sure the logic behind this condition. Need further clarification.
    // let bucket = bucketName;
    // if (!bucketName && this.bucketName) {
    //   bucket = this.bucketName;
    // } else {
    //   bucket = defaultBucket;
    // }
    return `https://s3.amazonaws.com/${bucketName}/${key}`;
  }

  /**
   * Generate an s3 key with an altered runtimestamp and filename
   * @param {string} sourceS3Key The original s3 key to mutate.
   * @param {string} fileName The new filename to use for the s3 key string.
   * @param {string} runTimeStamp The new runtimestamp to use for the s3 key string.
   * @returns {string}
   */
  static generateModifiedS3Key(sourceS3Key, fileName = '', runTimeStamp = '') {
    const timeStampRegex = /\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_(am|pm)/;
    const fileNameRegex = /(.*)\/(.+?\..+)$/;

    let modifiedS3Key = sourceS3Key;

    // replace the timestamp
    if (runTimeStamp) modifiedS3Key = modifiedS3Key.replace(timeStampRegex, runTimeStamp);

    // replace the filename
    if (fileName) {
      // the second capturing group will be the file name, the first will be everything preceeding the filename
      const matches = modifiedS3Key.match(fileNameRegex);
      if (matches) {
        modifiedS3Key = `${matches[1]}/${fileName}`;
      }
    }
    return modifiedS3Key;
  }

  /**
   * Parse the timestamp from an s3 key
   * @param {string} key The s3 key to parse the timestamp from.
   * @returns {string}
   */
  static parseTimeStampFromS3Key(key) {
    const timeStampRegex = /(\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_(am|pm))/;
    let timestamp = '';
    const matches = key.match(timeStampRegex);
    if (matches) {
      [, timestamp] = matches;
    }
    return timestamp;
  }

  /**
   * Parse the filename from an s3 key
   * @param {string} key the s3 key to parse the filename from
   * @returns {string}
   */
  static parseFileNameFromS3Key(key) {
    const fileNameRegex = /(.*)\/(.+?\..+)$/;
    let fileName = '';
    const matches = key.match(fileNameRegex);
    if (matches) {
      [, , fileName] = matches;
    }
    return fileName;
  }
}

module.exports = S3Handler;
