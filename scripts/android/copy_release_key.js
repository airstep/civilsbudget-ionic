#!/usr/bin/env node

var fs = require('fs')
var path = require('path')

console.log("Copy release key properties");
copySync('resources/android/keys/release-signing.properties', 'platforms/android/')
copySync('resources/android/keys/release.keystore', 'platforms/android/')

function copySync(src, dest) {
  dest += path.basename(src)
  fs.writeFileSync(dest, fs.readFileSync(src))
}
