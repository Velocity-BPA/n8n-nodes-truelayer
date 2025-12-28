const { src, dest } = require('gulp');

function buildIcons() {
  return src('nodes/**/*.svg').pipe(dest('dist/nodes'));
}

function copyIcons() {
  return src('nodes/**/*.{svg,png}').pipe(dest('dist/nodes'));
}

exports['build:icons'] = buildIcons;
exports.copyIcons = copyIcons;
exports.default = buildIcons;
