var x = new (require("transitive"))(),
    fs = require("fs");

var options = {};
var generated = process.cwd()+"/test_temp/"+require("uuid-pure").newId();
fs.mkdirSync(generated, "777");

exports.setUp = function (test, assert) {
  process.chdir("./test/views");
  options = x.loadOptions({});

  options.directories.generated = generated;
  options.mergeDefault = false;
  x.options = options;
  test.finish();
};

exports["test boot can work okay"] = function(test, assert){
  x.boot(this, options);
  assert.ok(x.options.root);
  test.finish();
};