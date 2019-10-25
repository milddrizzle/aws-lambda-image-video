const { promisify } = require("util")
const { join } = require("path");
const aws = require("aws-sdk");
const fluentffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const fs = require("fs");

fluentffmpeg.setFfmpegPath(ffmpegPath);

const S3 = new aws.S3();

exports.handler = ({ Records, bucket = "stepup-images" }, context, done) => {
  const key = Records[0].s3.object.key;
  const sanitizedKey = key.replace(/\+/g, " ");
  const parts = sanitizedKey.split("/");

  const filename = parts[parts.length - 1];

  const expected = {
    dest: "dynamic",
    mp4: changeExtension(filename, ".mp4"),
    webm: changeExtension(filename, ".webm")
  };

  const temp = {
    origin: temporaryPathFor(filename),
    mp4: temporaryPathFor(expected.mp4),
    webm: temporaryPathFor(expected.webm)
  };

  const url = S3.getSignedUrl("getObject", { Bucket: bucket, Key: sanitizedKey, Expires: 60 });

  downloadS3Image({ bucket, key: sanitizedKey, dest: temp.origin })
    .then(() => Promise.all([
      convertFromGIFToMP4({ from: url, to: temp.mp4 }),
      convertFromGIFToWebm({ from: url, to: temp.webm })
    ]))
    .then(() => Promise.all([
      saveToS3({ bucket, from: temp.mp4, to: join(expected.dest, expected.mp4) }),
      saveToS3({ bucket, from: temp.webm, to: join(expected.dest, expected.webm) })
    ]))
    .then(() => deleteFiles([temp.mp4, temp.webm]))
    .then(() => done(null, { success: true }))
    .catch(error => done(error));
};

function downloadS3Image({ bucket, key,  dest } = {}, { getObject = promisify(S3.getObject).bind(S3), writeFile = promisify(fs.writeFile).bind(fs) } = {}) {
  if (!bucket) throw new Error("bucket missing");

  return getObject({ Bucket: bucket, Key: key })
    .then(response => writeFile(dest, response.Body))
    .catch(error => console.log(error));
}

function convertFromGIFToMP4({ from, to } = {}, { ffmpeg = fluentffmpeg } = {}) {
  return new Promise((resolve, reject) => {
    ffmpeg(from).format("gif")
      .outputOptions(["-b:v 0", "-crf 25", "-vcodec libx264", "-pix_fmt yuv420p"]).toFormat("mp4")
      .on("error", (error) => { console.log("Error during processing", error); reject(error); })
      .on("end", () => { console.log("Processing finished!"); resolve(); })
      .save(to, { end: true });
  })
}

function convertFromGIFToWebm({ from, to } = {}, { ffmpeg = fluentffmpeg } = {}) {
  return new Promise((resolve, reject) => {
    ffmpeg(from).format("gif")
      .outputOptions(["-c:v libvpx-vp9", "-pix_fmt yuv420p"]).toFormat("webm")
      // .outputOptions(["-c:v libvpx-vp9", "-b:v 0", "-crf 30"]).toFormat("webm")
      .on("error", (error) => { console.log("Error during processing", error); reject(error); })
      .on("end", () => { console.log("Processing finished!"); resolve(); })
      .save(to, { end: true });
  })
}

function saveToS3 ({ bucket, from, to }) {
  return S3.putObject({ Body: fs.readFileSync(from), Bucket: "stepup-thumbnail", Key: to }).promise();
}

function deleteFiles(files, unlink = promisify(fs.unlink).bind(fs)) {
  return Promise.all(files.map(file => unlink(file)));
}

function changeExtension(name = "", ext = "") {
  const matched = name.match(/([\w-/]+).([A-Za-z]+)/);
  return matched ? `${matched[1]}${ext}` : matched;
}

function temporaryPathFor (name) { return `/tmp/${name}` }
