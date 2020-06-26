# AWS Lambda Images and Videes

Use Amazon S3 and Lambda to create image thumbnails and video thumbnails for web optimization.

-pre-create sizes that often use `image`. -> We will change to On-demand later and use Cloudwatch.
`gif` converts to` webm` and `mp4`. Since `gif` is large, it is difficult to give a good user experience when rendering.
`` `html
<picture>
  <source type = ”video / webm” srcset = ”image.webm”>
  <source type = ”video / mp4” srcset = ”video.mp4”>
  <img src = ”image.gif”>
</ picture>
`` `
Because the video must show the image before playback, it creates a thumbnail from the video, allowing the user to choose which thumbnail to use.

## Require

It must be installed in advance to manage Lamda, Layer.

aws-cli

## Using Modules

-[aws-sdk] (https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/index.html)
-[sharp] (https://sharp.pixelplumbing.com/en/stable/)
-[fluent-ffmpeg] (https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

## Create Lambda

### 1.Create Roles

Create `S3-Lambda-Role` in IAM with` AmazonS3FullAccess` and `AWSLambdaExecute` polices

### 2.Create Bucket

Create `stepup-images` and` stepup-thumbnai`.
The `stepup-images` bucket contains the` origin` resources and is associated with the `Lamda` trigger.
The `stepup-thumbnail` bucket contains resources created through` Lamda`.

### 3.Create Layers

Lambda with node_modules is expensive and time consuming.
To solve this problem, create a `Lamda Layer` and add it to` Lamda`. The `Layer` capacity is` MAX 50MB` per layer. The capacity per lamda is MAX 250MB. Combining layers well can make them easier and reduce costs.
Layers are distributed in `/ opt / nodejs`, so be careful when adding` Layer` to `Lamda` because adding multiple layers will gradually stack up like a stack.

If you create and distribute a utility as well as a module when you deploy, you can access it as follows.

`` `javascript
const aws = require ("aws-sdk");
const util = require ("/ opt / nodejs / util");
const fluentffmpeg = require ("fluent-ffmpeg");
`` `

### 4.Create Lambda

-Changes to `Memory-> 512MB`,` Timeout-> 1min 30sec` because it consumes a lot of memory and time.
The `sharp` module causes an error on Linux, so install it instead of` npm install --save sharp`.
`` `bash
rm -rf node_modules / sharp
npm install --save --arch = x64 --platform = linux --target = 10.15.0 sharp
`` `

### 5.Connect Layer

You need to add the created layer and press the Save button to apply it.

### 6.Connect S3 Trigger

Create and register an S3 trigger so the Lambda function is triggered when uploaded to S3.

## AWS CLI Command Lines

### create lambda function

`` `bash
aws lambda create-function \
  --function-name resizeImage \
  --zip-file fileb: //dist/function.zip \
  --runtime nodejs10.x \
  --handler index.handler \
  --role arn: aws: iam :: 484931367994: role / S3-Lambda-Role
`` `

-https://docs.aws.amazon.com/cli/latest/reference/lambda/create-function.html

### update lambda function code

`` `bash
aws lambda update-function-code \
  --function-name resizeImage \
  --zip-file fileb: //dist/function.zip
`` `

-https://docs.aws.amazon.com/cli/latest/reference/lambda/update-function-code.html

### publish layer

`` `bash
aws lambda publish-layer-version \
  --layer-name fluent-ffmpeg-layer \
  --zip-file fileb: ///var/app/layers/fluent-ffmpeg-layer/fluent-ffmpeg-layer.zip \
  --compatible-runtimes nodejs10.x
`` `

-https://docs.aws.amazon.com/cli/latest/reference/lambda/publish-layer-version.html


## References

-[GIF, WebP, WebM Formats] (#https: //www.bandisoft.com/honeycam/help/file_format/)
-[FFmpeg Encod / VP9] (https://trac.ffmpeg.org/wiki/Encode/VP9)
NodeJS Runtime Environment with AWS Lambda Layers (https://medium.com/@anjanava.biswas/nodejs-runtime-environment-with-aws-lambda-layers-f3914613e20e)
