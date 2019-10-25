# AWS Docker with Lambda

## Set AWS Configure

- region
- access_key 
- secret_key

```bash
# set properties
aws configure

# confirm
aws configure list
```

## Sharp

On non-Linux machines such as OS X and Windows run the following:

```bash
rm -rf node_modules/sharp
npm install --save --arch=x64 --platform=linux --target=10.15.0 sharp
```
