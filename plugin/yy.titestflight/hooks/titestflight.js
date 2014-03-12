var _ = require("underscore"),
    fs = require("fs"),
    afs = require("node-appc").fs,
    path = require("path"),
    Form = require("form-data"),
    archiver = require('archiver'),
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

  tf = _.pick(tf, 'api_token','team_token', 'notify', 'distribution_lists', 'dsym', 'release_notes_file');
  var f = {};
  var release_notes_path = afs.resolvePath(path.join(data.buildManifest.outputDir), ''+tf.release_notes_file);

  if (fs.existsSync(release_notes_path)) {
    tf.notes = fs.readFileSync(release_notes_path);
    fs.unlink(release_notes_path);
  } else {
    logger.error('Release note file not found (' + release_notes_path + ')');
  }

  if (_.isEmpty(tf.notes)) {
    f.notes = fields.text({
      title: "Release Notes",
      desc: "Enter release notes (required)",
      validate: function(value,callback) {
        callback(!value.length, value);
      }
    });
  }
  if (tf.notify === undefined) {
    f.notify= fields.select({
      title: "Notify",
      desc: "Notify list on upload",
      promptLabel:"(y,n)",
      options: ['__y__es','__n__o'],
    });
  } 
  if (tf.distribution_lists === undefined) {
    f.distribution_lists = fields.text({
      title: "Distribution Lists",
      desc: "Enter a comma separated list (or leave empty)"
    })
  }
  if ('ios' === data.cli.argv.platform && tf.dsym === undefined) {
    f.dsym= fields.select({
      title: "dSYM",
      desc: "Send dSYM",
      promptLabel:"(y,n)",
      options: ['__y__es','__n__o'],
    });
  }
  var prompt = fields.set(f);

  prompt.prompt(function(err, result) {
    var form = new Form();

    if (_.isEmpty(tf.notes)) {
      tf.notes = result.notes;
    } else {
      logger.info("Release notes file found");
    }

    if (result.distribution_lists && result.distribution_lists != "") {
      tf.distribution_lists = result.distribution_lists
    }
    if (result.notify !== undefined) {
      tf.notify = result.notify === "yes" ? "True" : "False";
    } else {
      tf.notify = tf.notify ? "True" : "False";
    }

    _.keys(tf).forEach(function(k) {
      if(k !== 'dsym') {
        form.append(k, tf[k]);
      }
    });
    var build_file =afs.resolvePath(path.join(data.buildManifest.outputDir, data.buildManifest.name + "." + (data.cli.argv.platform === "android" ? "apk" : "ipa")));
    form.append('file', fs.createReadStream(build_file));

    var dsym_path = path.join(data.cli.argv["project-dir"], 'build', 'iphone','build', 'Release-iphoneos',data.buildManifest.name + ".app.dSYM");
    if ((result.dsym === "yes" || tf.dsym === true) && fs.existsSync(dsym_path)) {
      logger.info("dSYM found");
      var dsym_zip = dsym_path + ".zip";
      var output = fs.createWriteStream(dsym_zip);
      var archive = archiver('zip');
      output.on('close', function() {
        logger.info("dSYM zipped");
        form.append('dsym',fs.createReadStream(dsym_zip));
        submit(form, finished);
      });
      archive.on('error', function(err) { throw err; });
      archive.pipe(output);
      archive.bulk([{expand:true, cwd: dsym_path, src:['**']}]);
      archive.finalize();
    } else {
      submit(form, finished);
    }
  });
};

function submit(form, callback) {
  logger.info("Uploading...");
  form.submit("http://testflightapp.com/api/builds.json", function(err, res) {
    if (err) {
      logger.error(err);
    } else {
      logger.info("Uploaded successfully.")
    }
    callback();
  }); 
}
