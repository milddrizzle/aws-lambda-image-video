const { execSync } = require('child_process');

const metadata = {
  'function-name': 'convertToMP4FromGIF',
  'zip-file': 'fileb://dist/function.zip',
  'runtime': 'nodejs10.x',
  'handler': 'index.handler',
  'role': 'arn:aws:iam::484931367994:role/S3-Lambda-Role'
};

const options = Object.entries(metadata).reduce(
  (query, [key, value]) => {
    query.push(`--${key}`);
    query.push(value);
    return query;
  },
  []
).join(' ');

execSync(`aws lambda create-function ${options}`);
