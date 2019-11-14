# AWS Lambda Images and Videos

Amazon S3 와 Lambda 를 이용하여 웹 최적화를 위한 이미지 썸네일과 비디어 썸네일을 생성한다.

- `image` 를 자주 쓰는 사이즈를 미리 생성한다. -> 추후 On-demand 방식으로 변경하고, Cloudwatch 를 사용할 예정이다.
- `gif` 는 `webm` 과 `mp4` 로 변환한다. `gif` 는 욜량이 크기 때문에 랜더링시 좋은 사용자 경험을 주기 힘들다.
```html
<picture>
  <source type=”video/webm” srcset=”image.webm”>
  <source type=”video/mp4” srcset=”video.mp4”>
  <img src=”image.gif”>
</picture>
```
- 영상은 재생 전 이미지를 보여주어야하기 때문에 영상에서 썸네일을 생성해서 사용자가 사용할 썸네일을 선택할 수 있게 해준다.

## Require

Lamda, Layer 를 관리하기 위해 미리 설치되어야 한다.

- aws-cli

## Using Modules

- [aws-sdk](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/index.html)
- [sharp](https://sharp.pixelplumbing.com/en/stable/)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)

## Create Lambda

### 1. Create Roles

Create `S3-Lambda-Role` in IAM with `AmazonS3FullAccess` and `AWSLambdaExecute` polices

### 2. Create Bucket

Create `stepup-images` and `stepup-thumbnai` 을 생성한다.  
`stepup-images` 버킷은 `origin` 리소스들이 위치하고, `Lamda` 트리거와 연결된다.  
`stepup-thumbnail` 버킷은 `Lamda` 를 통해 생성되는 리소스들이 위치한다.

### 3. Create Layers

Lambda 를 node_modules 와 함께 하면 용량이 크기 때문에, 비용과 시간이 많이 소요된다.  
이 문제를 해결하기 위해 `Lamda Layer` 를 만들어 `Lamda` 에 추가한다. `Layer` 용량은 하나의 레이어당 `MAX 50MB` 이다. `Lamda` 당 용량은 `MAX 250MB` 이다. 레이어를 잘 조합하면, 쉽게 만들고, 비용을 줄일 수 있다.  
레이어는 `/opt/nodejs` 에 배포되는데, 여러 레이어를 추가하면, 점점 스택처럼 쌓이기 때문에, `Lamda` 에 `Layer` 를 추가할 때 주의해야 한다.  

배포할 때 모듈 뿐만 아니라 유티를 생성해서 배포한다면 아래와 같이 접근할 수 있다.

```javascript
const aws = require("aws-sdk");
const util = require("/opt/nodejs/util");
const fluentffmpeg = require("fluent-ffmpeg");
```

### 4. Create Lambda

- 메모리와 시간을 많이 소모하기 때문에 `Memory -> 512MB`, `Timeout -> 1min 30sec` 로 변경
- `sharp` 모듈은 리눅스에서 에러가 발생하므로 `npm install --save sharp` 가 아닌 아래와 같이 설치한다.
```bash
rm -rf node_modules/sharp
npm install --save --arch=x64 --platform=linux --target=10.15.0 sharp
```

### 5. Connect Layer

생성한 레이어를 추가하고, 반드시 저장 버튼을 눌러주어야 적용된다.

### 6. Connect S3 Trigger

S3에 업로드 시 Lambda 함수가 트리거되도록 S3 트리거를 생성하여 등록해준다.

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
