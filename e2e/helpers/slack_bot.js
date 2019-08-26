const fs = require('fs');
const { WebClient } = require('@slack/client');

// use the .env config for our process env variables
require('dotenv').config();

// An access token (from your Slack app or custom integration - xoxa, xoxp, or xoxb)
const token = process.env.QA_SLACK_KEY;

/**
 * Upload files to a slack channel
 * @param  {Array} channels - array of strings where each string is a channel
 * @param  {String} comment - comment to give along with the file
 * @param  {String} name - name of the file
 * @param  {File} file - file to upload
 * @returns {Object}
 */
function uploadSlackFile(channels, comment, name, file) {
  const web = new WebClient(token);

  //  Send a file to a channel
  // See: https://api.slack.com/methods/files.upload
  return web.files.upload({
    initial_comment: comment,
    filename: name,
    // You can use a ReadableStream or a Buffer for the file option
    file: fs.createReadStream(`${file}`),
    channels,
  });
}

/**
 * Post a simple string message to a Slack channel.
 *
 * @param  {String} channel - channel to post message to
 * @param  {String} message - message to be sent
 * @returns {Promise}
 */
function postMessage(channel, message) {
  // construct our payload to send to Slack
  const payload = {
    channel,
    text: message,
  };

  const web = new WebClient(token);
  return web.chat.postMessage(payload);
}

/**
 * Post a JSON formatted message to a Slack channel.
 *
 * @param {String} channel - channel to post message to
 * @param {Object} message - JSON formated message to be sent
 * @returns {Promise}
 */
function postFormattedMessage(channel, message) {
  // add the channel property to our JSON object
  const payload = message;
  payload.channel = channel;

  const web = new WebClient(token);
  return web.chat.postMessage(payload);
}

module.exports = { uploadSlackFile, postMessage, postFormattedMessage };
