var tagWriters = module.exports = {
  css: function (url) {
    return '<link rel="stylesheet" href="' + url + '" />';
  },
  js: function (url) {
    return '<script src="' + url + '"></script>';
  },
  noop: function (url) {
    return url;
  }
};
