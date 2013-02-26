var Assets = module.exports = function (options) {
  this.options = options;
  this.tagWriter = this.options.pathsOnly
    ? require("./tagWriters/passthroughWriter")
    : require("./tagWriters/xHtml5Writer");

  this.registerHelpers();
};

Assets.prototype.registerHelpers = function () {
  this.options.helperContext.css = this.cssFn.bind(this);
  this.options.helperContext.js = this.jsFn.bind(this);
};

Assets.prototype.cssFn = function (route) {
};

Assets.prototype.jsFn = function (route, options) {
};

Assets.prototype.middleware = function (req, res, next) {
  
};