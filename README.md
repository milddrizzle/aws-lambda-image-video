# AWS Lambda Images and Videes

Use AWS Lambda to optimize for web

## Using Modules

- [aws-sdk](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/index.html)
- [sharp](https://sharp.pixelplumbing.com/en/stable/)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

## Create Lambda

### 1. Create Roles

### 2. Create Layers

### 3. Create Lambda

- 메모리와 시간을 많이 소모하기 때문에 `Memory -> 512MB`, `Timeout -> 1min 30sec` 로 변경
- `sharp` 모듈은 리눅스에서 에러가 발생하므로 `npm install --save sharp` 가 아닌 아래와 같이 설치한다.
```bash
rm -rf node_modules/sharp
npm install --save --arch=x64 --platform=linux --target=10.15.0 sharp
```

### 4. Connect Trigger to S3

## AWS CLI Command Lines

### create lambda function

```bash
aws lambda create-function \
  --function-name resizeImage \
  --zip-file fileb://dist/function.zip \
  --runtime nodejs10.x \
  --handler index.handler \
  --role arn:aws:iam::484931367994:role/S3-Lambda-Role
```

- https://docs.aws.amazon.com/cli/latest/reference/lambda/create-function.html

### update lambda function code

```bash
aws lambda update-function-code \
  --function-name resizeImage \
  --zip-file fileb://dist/function.zip
```

- https://docs.aws.amazon.com/cli/latest/reference/lambda/update-function-code.html

### publish layer

```bash
aws lambda publish-layer-version \
  --layer-name fluent-ffmpeg-layer \
  --zip-file fileb:///var/app/layers/fluent-ffmpeg-layer/fluent-ffmpeg-layer.zip \
  --compatible-runtimes nodejs10.x
```

- https://docs.aws.amazon.com/cli/latest/reference/lambda/publish-layer-version.html


## References

- [GIF, WebP, WebM 포맷](#https://kr.bandisoft.com/honeycam/help/file_format/)
- [FFmpeg Encod/VP9](https://trac.ffmpeg.org/wiki/Encode/VP9)
- [NodeJS Runtime Environment with AWS Lambda Layers](https://medium.com/@anjanava.biswas/nodejs-runtime-environment-with-aws-lambda-layers-f3914613e20e)
