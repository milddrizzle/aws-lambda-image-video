const { promisify } = require("util");
const { join } = require("path");
const aws = require("aws-sdk");
const fluentffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const fs = require("fs");

fluentffmpeg.setFfmpegPath(ffmpegPath);
fluentffmpeg.setFfprobePath(ffprobePath);

const S3 = new aws.S3();

const BUCKET_ORIGIN = "stepup-images";
const BUCKET_THUMBNAIL = "stepup-thumbnail";

const TEMP_DIR = "/tmp/video/thumbnail";

module.exports.handler = async (event, context, done) => {
  const key = decodeURIComponent(event.Records[0].s3.object.key).replace(/\+/, " ");
  const parts = key.split("/");

  const filename = parts[parts.length - 1];
  const timestamps = ["5%", "15%", "20%"];

  try {
    const url = S3.getSignedUrl("getObject", { Bucket: BUCKET_ORIGIN, Key: key, Expires: 60 });

    const { name, ext } = toJSONFile(filename);
    const filenames = timestamps.map((_, index) => getTempThumbnailFile({ index: index + 1, filename: name, ext: "png" }));

    fs.mkdirSync(TEMP_DIR, { recursive: true });

    await createThumbnail({ url, filename: name, timestamps, dest: TEMP_DIR });
    await Promise.all(filenames.map(file => saveToS3({ bucket: BUCKET_THUMBNAIL, from: file.path, to: `dynamic/${file.name}` })));

    done(null, { success: true });
  } catch (error) {
    done(error);
  }
};

function createThumbnail({ url, filename, ext = ".png", timestamps, dest = TEMP_DIR } = {}) {
  return new Promise((resolve, reject) => {
    fluentffmpeg(url)
      .screenshots({ timestamps, filename: `${filename}_%i${ext}`, folder: dest })
      .on("filenames", function(filenames) {
        console.log("Will generate " + filenames.join(", "));
      })
      .on("error", (error) => { console.log("Error during processing", error); reject(error); })
      .on("end", () => { console.log("Processing finished!"); resolve(); })
  });
}

function getTempThumbnailFile({ index, filename, ext }) {
  const name = `${filename}_${index}.${ext}`;

  return {
    path: `${TEMP_DIR}/${name}`,
    name
  };
}

function saveToS3 ({ bucket, from, to }) {
  return S3.putObject({ Body: fs.readFileSync(from), Bucket: bucket, Key: to }).promise();
}

function toJSONFile(filename) {
  const result = { name: filename, ext: "" };
  const matched = filename.match(/([\w-/]+)(.[A-Za-z0-9]+)/);

  return matched ? Object.assign(result, { name: matched[1], ext: matched[2] }) : result;
}
