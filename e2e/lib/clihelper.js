const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

const DEFAULT_DATE_FORMAT = 'MM_DD_YY_HH_mm_ss_a';

/**
 * clean up a string to use for file paths
 * @param name
 */
const cleanFileName = name => name
  .replace(/\//gi, '__')
  .replace(/[^a-z0-9]/gi, '_')
  .toLowerCase();

/**
 * get the file name from a directory
 * @param  {string} dir - the path leading to the file
 */
const getFileFromDirPath = (dir) => {
  const matches = dir.match(/([^\/]+)$/g);
  if (matches) {
    return matches[0].replace(/\.(.*)/g, '');
  }
  return '';
};

/**
 * get the current date time in a readable format for file paths
 */
const getFileDateString = () => moment().tz('America/New_York').format(DEFAULT_DATE_FORMAT);

const getTimeFromFormatString = dateStr => moment(dateStr, DEFAULT_DATE_FORMAT).unix();

/**
 * Walk upwards until we find the file and return the absolute path
 * @param startDir
 * @param fileName
 */
const findFile = (dir, fileName, limit = '/automation') => {
  // make sure we're not at the limit
  const limitRegex = new RegExp(`${limit}$`);

  // test the dir against the limit
  if (limitRegex.test(dir)) {
    return false;
  }

  // create file name
  const fullPath = path.join(dir, fileName);

  // exists?
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  // otherwise, return the parent
  return findFile(path.join(dir, '..'), fileName, limit);
};

/**
 * Walk upwards until we find the file and return the absolute path.
 *
 * @param {string} currentDir current working directory
 * @param {string} uploadDir directory you want to upload
 * @param {string} limit directory limit
 * @returns {string | boolean}
 */
const getUploadDirectory = (currentDir, uploadDir, limit = '/qa-engineering') => {
  // make sure we're not at the limit
  const limitRegex = new RegExp(`${limit}$`);

  // test the dir against the limit
  if (limitRegex.test(currentDir)) {
    return false;
  }

  // create upload directory
  const fullPath = path.join(currentDir, uploadDir);

  // exists?
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  // otherwise, return the parent
  return getUploadDirectory(path.join(currentDir, '..'), uploadDir, limit);
};

module.exports = {
  cleanFileName,
  getFileFromDirPath,
  getFileDateString,
  findFile,
  getTimeFromFormatString,
  getUploadDirectory,
};
