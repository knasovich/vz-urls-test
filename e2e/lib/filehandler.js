const path = require('path');
const fs = require('fs-extra');
const klaw = require('klaw');

/**
 * all file handling responsibilities
 */
class FileHandler {
  /**
   *
   * @param rootDir inject the directory to make it testable
   */
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  get testFolderPath() {
    return path.join(this.rootDir, 'tests');
  }

  get configPath() {
    return path.join(this.rootDir, 'config.json');
  }

  get wdioPath() {
    return path.join(this.rootDir, 'wdio.conf.json');
  }

  get config() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8').toString());
    } catch (e) {
      // if the file doesn't exist, just return false
      return false;
    }
  }

  get outputDir() {
    const resultsDir = path.join(this.rootDir, 'results/source');

    // make sure the dir exists
    fs.ensureDirSync(resultsDir);
    return resultsDir;
  }

  get referenceResultsDir() {
    return path.join(this.rootDir, '/results/reference');
  }

  static isDirectory(filePath) {
    let isDirectory = false;
    const fileExtRegex = new RegExp('^.+\\..+$'); // eslint-disable-line no-useless-escape
    if (fs.existsSync(filePath)) {
      isDirectory = fs.lstatSync(filePath).isDirectory();
    } else {
      /* the file doesn't actually exist; lets check if the
       *  non-existent path does not have a file extension
       * */
      const match = fileExtRegex.test(filePath);
      if (!match) {
        isDirectory = true;
      }
    }
    return isDirectory;
  }

  static ensurePath(filePath) {
    const isDirectory = FileHandler.isDirectory(filePath);
    if (isDirectory) {
      fs.ensureDirSync(filePath);
    } else {
      fs.ensureFileSync(filePath);
    }
  }

  clearReferenceResults() {
    fs.emptyDirSync(this.referenceResultsDir);
  }

  /**
   * Clean up output dir and make sure it exists
   */
  setUpOutputDir() {
    fs.emptyDirSync(this.outputDir);
  }

  getReferenceFilename(filePath) {
    // make sure the paths exist
    fs.ensureDirSync(this.referenceResultsDir);
    const newFile = path.join(this.referenceResultsDir, filePath);
    fs.ensureDirSync(path.dirname(newFile));

    return newFile;
  }

  writeConfig(contents) {
    return fs.writeFile(this.configPath, JSON.stringify(contents));
  }

  async writeCrawlResults(results) {
    await fs.ensureDir(this.outputDir);
    fs.writeJson(path.join(this.outputDir, 'crawl.json'), results);
  }

  /**
   * Write VR failure URLs to file.
   * 
   * @param {Array} failures array of failing URLs
   * @returns {Void}
   */
  async writeVRFailures(failures) {
    await fs.ensureDir(this.outputDir);
    fs.writeJson(path.join(this.outputDir, 'vr_failures.json'), failures);
  }

  async writeScreenshot(fileName, screen) {
    // make sure the screenshot dir exists
    await fs.ensureDir(this.outputDir);

    const outputFile = path.join(this.outputDir, fileName);

    // make sure the file dir exists
    const pageFolder = path.dirname(outputFile);
    await fs.ensureDir(pageFolder);

    // write the file
    fs.writeFile(outputFile, screen, 'base64');
  }

  async writePerf(fileName, results) {
    // make sure the screenshot dir exists
    await fs.ensureDir(this.outputDir);

    const outputFile = path.join(this.outputDir, fileName);

    // make sure the file dir exists
    const pageFolder = path.dirname(outputFile);
    await fs.ensureDir(pageFolder);

    // write the file
    fs.writeJson(outputFile, results);
  }

  async writeProactiveData(fileName, data) {
    // make sure the proactive dir exists
    await fs.ensureDir(this.outputDir);

    // make sure the file dir exists
    const pageFolder = path.join(this.outputDir, fileName);
    await fs.ensureDir(pageFolder);

    // write file
    fs.writeJson(path.join(pageFolder, 'proactive.json'), data);
  }

  async writeDiffResults(data, fileName) {
    await fs.ensureDirSync(this.outputDir);

    // write
    fs.writeJsonSync(fileName, data);
  }

  async writeContentDiffResults(pathName, data, env) {
    // make sure the proactive dir exists
    await fs.ensureDir(pathName);

    // write
    return fs.writeJsonSync(path.join(pathName, 'contentCompare.json'), data);
  }

  /**
   * update config with test data
   */
  addTestDataToConfig(cnts) {
    // get the config
    const configData = this.config;

    // add to the config
    configData.testData = cnts;

    // write back
    this.writeConfig(configData);
  }

  /**
   * Create a backup of an existing file
   * @param name
   * @param contents
   * @returns {Promise}
   */
  writeBackup(expFolder, name, contents) {
    const folderPath = path.join(this.testFolderPath, expFolder, 'backups');
    // get the time
    const timestamp = new Date().getTime();

    // create a new file location
    const fileLoc = path.join(folderPath, `${name}.${timestamp}.js`);

    // create the backup folder
    return new Promise((resolve, reject) => {
      fs.mkdir(folderPath, () => {
        // write
        fs.writeFile(fileLoc, contents, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * get the contents of the given test file
   * @param name
   */
  getTestFile(expFolder, name) {
    // return a promise
    return new Promise((resolve, reject) => {
      // create a filepath
      const filePath = path.join(this.rootDir, 'tests', expFolder, `${name}.test.js`);

      // read
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.toString());
        }
      });
    });
  }

  writeWdio(contents) {
    return fs.writeFile(this.wdioPath, JSON.stringify(contents));
  }

  writeTestFile(expDir, name, contents) {
    // create exp and test dir if not exists
    const testDir = path.join(this.rootDir, 'tests', expDir);
    fs.ensureDir(testDir, () => {
      // ignore errors
      return fs.writeFile(path.join(testDir, `${name}.test.js`), contents);
    });
  }

  mergeTestFiles(file1, file2) {
    // read test file
    const testFileStr = fs.readFileSync(testFile, 'utf8');
    // merge the files together
    const mergedFile = Api.mergeTestFiles(Api.prepTestFileToMerge(testFileStr), generatedFileStr);
    // overwrite test file
    return fs.writeFile(testFilePath, mergedFile, (err) => {
      if (err) throw err;
      console.log('test.js file has been updated');
    });
  }

  getFiles(filePath) {
    const files = [];

    return new Promise((resolve, reject) => {
      klaw(filePath)
        .on('error', err => reject(err)) // forward the error on
        .on('data', item => files.push(item.path))
        .on('end', () => {
          resolve(files);
        });
    });
  }
}

module.exports = FileHandler;
