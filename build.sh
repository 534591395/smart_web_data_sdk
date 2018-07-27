#!/bin/bash

echo '开始执行编译'
echo '注意：utils.js 中 所需的库 current-device install后，记得把它的 json 中  "main" 值指向 es6版本  "es/index.js" ，否则打包将失败'
version=$(cat version)

./node_modules/.bin/rollup -i loader/loader-sync.js -f iife -o build/$version/smart.sync.js -n smart -c rollup.config.js

#sleep 20