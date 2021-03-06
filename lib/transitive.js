//System Libraries
var path = require("path"),
    find = require("findit").findSync,
    _ = require("underscore");

//External Libraries
var connect = require("connect");
var PushIt = require("push-it").PushIt;
var nopt = require("nopt");

//Internal Utils
var defaultOptions = require("./defaults");
var merge = require("./utils/deep_merge");

var Transitive = function(){
  
};

Tx = {};
Transitive.prototype = Tx;

Tx.Views = require("./views/views");
Tx.Assets = require("./assets");

Tx.boot = function(scope, options){
  if( typeof(options) === "undefined" ){
    options = {};
  }

  this.options = this.loadOptions(options);
  
  if(this.options.compileViews){
    this.Views.compile(this.options);
  }

  if(this.options.compileBrowserVersions){
    this.Assets.shareWithBrowser(this.options);
  }

  this.loadTemplates(this.options);
  
  if(this.options.mixin){
    this.mixin(scope);
  }

  if(this.options.createServer){
    this.createServer(this.options);
  }
  
  if(this.options.loadControllers){
    this.loadControllers(this.options);
  }
};

Tx.knownOpts = { 
  port: Number,
  createServer:Boolean,
  compileViews: Boolean,
  writeTemplates:Boolean,
  compileBrowserVersions: Boolean,
  mixin: Boolean,
  dumpOptions: Boolean,
  mergeDefault:Boolean,
  loadControllers: Boolean
};

//note that this mutates defaultOptions if mergeDefault is true.
Tx.loadOptions = function(options){
  options.mergeDefault = "mergeDefault" in options ? options.mergeDefault : true;
  
  if(options.mergeDefault){
    options = merge(defaultOptions, options);
  }
  
  if(!options.root){
    options.root = process.cwd();
  }
  
  var cliOptions = nopt(this.knownOpts);
  options = merge(options, cliOptions);
  
  if(options.dumpOptions){
    console.log("Transitive.options="+sys.inspect(options));
  }

  return options;
};

Tx.loadTemplates = function(options){
  var folder = options.directories.generated;
  //require need relative paths to have ./ in front of them...
  //instead of figuring out if generated is relative, just make it absolute!
  var templateFile = path.resolve(folder+ "/templates.js");
  
  this.Views.templates = require(templateFile);
  
  return this.Views.templates;
};

Tx.loadControllers = function(options){
  var self = this;
  var folder = path.resolve(options.directories.controllers);

  var filenames = _(find(folder)).chain()
      .reduce(function(filenames, name){
          if(fs.statSync(name).isFile()){ filenames.push(name); }
          return filenames;
        }, []).value();

  _(filenames).each(function(filename){
    self.registerController(require(filename));
  });
};

Tx.registerController = function(controllerFn){
  var Transitive = this;
  Transitive.server.use(connect.router(function(app){
    controllerFn(app, Transitive);
  }));
};

Tx.createServer = function(options){
  if(options.server){
    this.server = options.server;
  }else{
    this.server = connect();
  }

  this.pushIt = new PushIt(this.server, options.pushIt);
  this.server.use(connect.static(options.directories.public));
  this.server.use(connect.static(options.directories.generatedPublic));
  this.server.listen(this.options.port );
};

Tx.mixin = function(scope) {
  var mix = "fs sys connect".split(" ");
  mix.forEach(function(e){
    scope[e] = require(e);
  });
};

module.exports = Transitive;