const { execSync } = require('child_process');

const metadata = {
  'function-name': 'convertToMP4FromGIF',
  'zip-file': 'fileb://dist/function.zip'
};

const options = Object.entries(metadata).reduce(
  (query, [key, value]) => {
    query.push(`--${key}`);
    query.push(value);
    return query;
  },
  []
).join(' ');

execSync(`aws lambda update-function-code ${options}`);
