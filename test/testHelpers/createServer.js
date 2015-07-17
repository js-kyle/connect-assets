var assets = require("../..");
var connect = require("connect");

var createServer = module.exports = function (opts, done) {
  opts.paths = [ "test/assets/js", "test/assets/css" ];
  opts.helperContext = this;

  var app = this.app = connect().use(assets(opts));
  var scope = this;

  app.listen(function () {
    opts.helperContext.host = "http://localhost:" + this.address().port;
    done.call(scope);
  });
};
