var _ = require("underscore"),
    fs = require("fs"),
    afs = require("node-appc").fs,
    path = require("path"),
    Form = require("form-data"),
    fields = require("fields");

exports.cliVersion = '>=3.2';
var logger;
exports.init = function (_logger, config, cli, appc) {
  if (process.argv.indexOf('--test-flight') !== -1 || process.argv.indexOf('--testflight') !== -1) {
    cli.addHook('build.finalize', doTestFlight); 
  }
  logger = _logger;
}

function doTestFlight(data, finished) {
  
  if (data.buildManifest.outputDir === undefined) {
    logger.error("Output directory must be defined to use --testflight flag");
    finished();
    return;
  }

  if (['android', 'ios'].indexOf(data.cli.argv.platform) === -1) {
    logger.error("Only android and ios support with --testflight flag");
    finished();
    return;
  }

  var keys = _.keys(data.tiapp.properties).filter(function(e) { return e.match("^testflight\.");});
  var tf = {};
  keys.forEach(function(k) {
    tf[k.replace(/^testflight\./,'')] = data.tiapp.properties[k].value;
  });
  if (tf.api_token === undefined) {
    logger.error("testflight.api_token is missing.");
    finished();
    return;
  } 
  if (tf.team_token === undefined) {
    logger.error("testflight.team_token is missing.");
    finished();
    return;
  } 
  tf = _.pick(tf, 'api_token','team_token', 'notify', 'distribution_lists');
  tf.notify = tf.notify ? "True" : "False";
  var prompt = fields.set({
    text: fields.text({
      title:"\nNotes",
      desc: "Enter release notes",
      validate: function(value,callback) {
        callback(!value.length, value);
      }
    })
  });
  prompt.prompt(function(err, result) {
    tf.notes = result.text;
    var form = new Form();
    _.keys(tf).forEach(function(k) {
      form.append(k, tf[k]);
    });
    var build_file =afs.resolvePath(path.join(data.buildManifest.outputDir, data.buildManifest.name + "." + (data.cli.argv.platform === "android" ? "apk" : "ipa")));
    form.append('file', fs.createReadStream(build_file));
   
    logger.info("Uploading...");
    form.submit("http://testflightapp.com/api/builds.json", function(err, res) {
      if (err) {
        logger.error(err);
      } else {
        logger.info("Uploaded successfully.")
      }
      finished();
    }); 
  });
};
