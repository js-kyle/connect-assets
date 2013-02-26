var PassthroughWriter = module.exports = {};

PassthroughWriter.cssTag = function (path) { 
  return path; 
};

PassthroughWriter.jsTag = function (path) { 
  return path; 
};