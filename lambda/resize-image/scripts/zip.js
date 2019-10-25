const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const rm = require('rimraf');

const size = require('./utils/size');

const DIST_DIR = 'dist';
const packages = [
  // 'node_modules/',
  'index.js',
  // 'package.json',
  // 'package-lock.json'
].join(' ');


if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR);
}

function clear() {
  rm.sync(DIST_DIR);
  console.log(`Deleted ${DIST_DIR} folder.`);
}

function mkdir() {
  fs.mkdirSync(DIST_DIR);
  console.log(`Created ${DIST_DIR} folder.`);
}

async function zip() {
  const { stderr } = await exec(`zip -r ${DIST_DIR}/function.zip ${packages}`);

  if (stderr) {
    console.log(`Error is occurred : , ${stderr}`);
    exit(1);
  }

  console.log(size(`${DIST_DIR}/function.zip`));
}

async function bootstrap() {
  clear();
  mkdir()
  zip();
}

bootstrap();
