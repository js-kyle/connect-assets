var XHtml5Writer = module.exports = {};

XHtml5Writer.cssTag = function (path) {
  return "<link rel=\"stylesheet\" href=\"" + path + "\" />";
};

XHtml5Writer.jsTag = function (path, options) {
  options = options || {};
  var loadingAttribute = "";
  
  if (options.async)
    loadingAttribute = "async=\"async\" ";
  
  if (options.defer)
    loadingAttribute = "defer=\"defer\" ";

  return "<script " + loadingAttribute + "src=\"" + path + "\"></script>";
};
