var fs = require("fs");

var rmrf = module.exports = function (dir, callback) {
  fs.readdir(dir, function (err, files) {
    if (err) return callback(err);
    for (var i = 0; i < files.length; i++) {
      fs.unlinkSync(dir + "/" + files[i]);
    };

    fs.rmdir(dir, callback);
  });
};
