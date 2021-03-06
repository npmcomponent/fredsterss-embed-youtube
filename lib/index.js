var Emitter = require('component-emitter')
  , swfobject = require('fredsterss-swfobject')
  , uid = require('matthewmueller-uid')
  , bind = require('component-bind')
  , query = require('component-querystring');

/**
 * Defaults for the player
 *   @property {Number} enable javascript API
 *   @property {String} Player ID
 *   @property {Number} Player Version
 *   @property {Number} Modest Branding
 */
var playerDefaults = {
  enablejsapi: 1,
  playerapiid: "ytplayer",
  version: 3,
  modestbranding: 1,
  rel: 0
}

/**
 * Expose youtube
 */
module.exports = Youtube;

/**
 * initialize and show a new Youtube video
 * @param {el} dom element to render over
 * @param {String} youtube.com video ID 
 * @param {Object} options
 *   @property {Number} width
 *   @property {Number} height
 *   @property {Boolean} show controls (optional)
 * @param {Function} optional callback
 */
function Youtube (el, videoId, options, callback) {
  if (!(this instanceof Youtube)) return new Youtube(el, videoId, options, callback);
  if (typeof options != "object") throw "Options must be a hash. Options.width and Options.height are required. See the readme for more information."

  this.playerState = -2
, this.el = el
, this.videoId = videoId
, width = options.width || 640
, height = options.height || 360
, controls = (options.controls == undefined) ? 1 : options.controls
, params = { allowScriptAccess: "always" }
, attrs = { id: "ytplayer" };

  // append div with random ID to el, to be replaced by swfobject
  var newDiv = document.createElement("div");
  newDiv.id = uid();
  this.el.appendChild(newDiv);

  window.onYouTubePlayerReady = bind(this, this.definePlayer);
  swfobject.embedSWF(this.makeUrl(videoId, controls), newDiv.id, width, height, "8", null, null, params, attrs);
  if ('function' === typeof callback) callback();
  return this;
};

/**
 * Mixin emitter
 */
Emitter(Youtube.prototype);

/**
 * Defines player
 * @return {Boolean}
 */
Youtube.prototype.definePlayer = function (playerId) {
  this.player = document.getElementById(playerId);
  updatePlayerState = bind(this, this.updatePlayerState);
  this.player.addEventListener("onStateChange", "updatePlayerState");
  this.emit('playerReady');
  return true;
};

/**
 * Updates the current player state
 * @param  {Number} current player state
 * @return {Boolean}
 */
Youtube.prototype.updatePlayerState = function (newState) {
  this.playerState = newState;
  this.emit('stateChange', this.playerState);
  return true;
}

/**
 * Return a Youtube embeddeable video URL
 * @param  {String} Youtube Video ID
 * @param  {Boolean} True if you want controls
 * @return {String} Valid youtube video URL
 */
Youtube.prototype.makeUrl = function (videoId, controls) {
  return "//www.youtube.com/v/"
        + videoId 
        + "?" 
        + query.stringify(playerDefaults)
        + "&controls=" 
        + this.booleanToNumbers(controls).toString();
}

/**
 * Play the video
 * @param  {Number} optional number of seconds to play from
 * @param  {Function} optional callback
 * @return {Youtube}
 */
Youtube.prototype.play = function (seconds, callback) {
  // If the player is not yet ready, stop execution and re-call function when it is.
  if (this.playerState == -2) {
    this.once("stateChange", function (newState) { this.play(seconds, callback); });
    return this;
  }

  this.player.playVideo();
  this.emit('play');
  if (seconds != undefined) { this.seekTo(seconds); }
  if ('function' === typeof callback) callback();
  return this;
}

/**
 * Pause the current video
 * @param  {Function} optional callback
 * @return {Youtube}
 */
Youtube.prototype.pause = function (callback) {
  this.player.pauseVideo();
  this.emit('pause');
  if ('function' === typeof callback) callback();
  return this;  
}

/**
 * Seek to specific point in the current video
 * @param  {Number} number of seconds to start from
 * @param  {Function} optional callback
 * @return {Youtube}
 */
Youtube.prototype.seekTo = function (seconds, callback) {
  if (this.playerState != 1) {
    this.once("stateChange", function (newState) { this.seekTo(seconds, callback); });
    return this;
  }
  this.player.seekTo(seconds, true);
  this.emit('seek');
  if ('function' === typeof callback) callback();
  return this;
}

/**
 * Stop current video
 * @param  {Function} optional callback
 * @return {Youtube}
 */
Youtube.prototype.stop = function (callback) {
  this.player.stopVideo();
  this.emit('stop');
  if ('function' === typeof callback) callback();
  return this;
}

/**
 * Converts Boolean to Numbers
 * @param  {Boolean} bool to convert
 * @return {Number} 1 or 0
 */
Youtube.prototype.booleanToNumbers = function (bool) {
  return (bool) ? 1 : 0;
}