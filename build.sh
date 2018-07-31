#!/bin/bash

echo '开始执行编译'
version=$(cat version)

./node_modules/.bin/rollup -i loader/loader-sync.js -f iife -o build/$version/smart.sync.js -n smart -c rollup.config.js

sleep 2