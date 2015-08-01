require("connect");

var assets = require("..");
var connect = require("connect");
var opts = { paths: ["example/assets/js"] };

var app = this.app = connect().use(assets(opts));
  
app.use(function(req, res) {
   var html = "<html><head>" + js("sample") + "</head><body>Check out the source!</body></html>";
   res.setHeader("Content-Type", "text/html");
   res.setHeader("Content-Length", html.length);
   res.end(html);
});

app.listen(function () {
   console.log("Example connect-assets server listening on " + this.address().port);
});
