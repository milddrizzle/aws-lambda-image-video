const aws = require("aws-sdk");
const { join } = require("path");
const sharp = require("sharp");

const S3 = new aws.S3();

const BUCKET_ORIGIN = "stepup-images";
const BUCKET_THUMBNAIL = "stepup-thumbnail";

const transforms = [
  { name: "static/sm", width: 640 },
  { name: "static/md", width: 1024 },
  { name: "static/lg", width: 1920 }
];

exports.handler = async (event, context, done) => {
  const key = event.Records[0].s3.object.key;
  const sanitizedKey = key.replace(/\+/g, " ");
  const parts = sanitizedKey.split("/");

  const filename = parts[parts.length - 1];
  const webpname = changeExtension(filename, ".webp");

  try {
    const image = await S3.getObject({ Bucket: BUCKET_ORIGIN, Key: sanitizedKey }).promise();
    const webp = await createWebp(image.Body);

    await Promise
      .all(flatten(transforms.map(form => [
        createThumbnailAndUpload({ data: image.Body, to: join(form.name, filename), bucket: BUCKET_THUMBNAIL, transforms }),
        createThumbnailAndUpload({ data: webp, to: join(form.name, webpname), bucket: BUCKET_THUMBNAIL, transforms }),
      ])));

    done(null, { success: true });
  } catch (error) {
    done(error);
  }
};

async function createWebp(image) {
  return sharp(image).webp({ lossless: true }).toBuffer();
}

async function createThumbnailAndUpload({ data, to, bucket, transforms }) {
  const buffer = await createThumbnail({ data, transforms });
  return await saveToS3({ data: buffer, to, bucket });
}

async function createThumbnail({ data, transforms: { width } }) {
  return await sharp(data).resize({ width }).toBuffer();
}

async function saveToS3({ bucket, data, to }) {
  return S3.putObject({
    Bucket: bucket,
    Body: data,
    Key: to
  }).promise();
}

function flatten(array = []) {
  return array.reduce((result, data) => result.concat(data), []);
}

function changeExtension(name = '', ext = '') {
  const matched = name.match(/([\w-/]+).([A-Za-z]+)/);
  return matched ? `${matched[1]}${ext}` : matched;
}