#!/usr/bin/env bash

layer_name="resize-image-layer"

rm -rf ${layer_name}.zip

zip -r ${layer_name}.zip nodejs/

aws lambda publish-layer-version \
  --layer-name ${layer_name} \
  --zip-file fileb:///var/app/layers/${layer_name}/${layer_name}.zip \
  --compatible-runtimes nodejs10.x