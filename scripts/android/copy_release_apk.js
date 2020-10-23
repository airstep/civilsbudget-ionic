// #!/usr/bin/env node

var fs = require('fs')
var path = require('path')

// var rootdir = process.argv[2];

function loadConfigXMLDoc(filePath) {
    var fs = require('fs');
    var xml2js = require('xml2js');
    var json = "";
    try {
        var fileData = fs.readFileSync(filePath, 'ascii');
        var parser = new xml2js.Parser();
        parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
          if (err)
            console.error(err)
          json = result;
        });
        console.log("\n\nFile '" + filePath + "' was successfully read.\n\n");
        return json;
    } catch (ex) {
        console.log(ex)
    }
}


console.log("Try to copy apk to bin folder as release");

var configXMLPath = "config.xml";
var rawJSON = loadConfigXMLDoc(configXMLPath);

var version = rawJSON.widget.$.version;
console.log("Version:\t", version);
version = version.replace(/\./g, '_')

var id = rawJSON.widget.$.id;
console.log("id:\t\t", id);
id = id.replace(/\./g, '_')

showSize('Debug', 'platforms/android/app/build/outputs/apk/debug/app-debug.apk')
copySync('platforms/android/app/build/outputs/apk/debug/app-debug.apk', 'dist/stage_' + id + '_' + version + '.apk');
copySync('platforms/android/app/build/outputs/apk/release/app-release.apk', 'dist/' + id + '_' + version + '.apk');

function copySync(src, dest) {
  if (fs.existsSync(src)) {
    var target = path.dirname(dest)
    fs.existsSync(target) || fs.mkdirSync(target)
    showSize('Release', src)
    fs.writeFileSync(dest, fs.readFileSync(src))
  } else {
    console.log('\n\nSkip sign! Not release version...\n\n')
  }
}

function showSize(mode, src) {
  if (fs.existsSync(src))
    console.log(mode + ' file size: ' + getFileSizeInBytes(src) + ' bytes')
}

function getFileSizeInBytes(filename) {
 const stats = fs.statSync(filename)
 const fileSizeInBytes = stats.size
 return fileSizeInBytes
}
