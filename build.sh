#!/usr/bin/env bash

# Automated build script. Intended for continuous integration use.

set -ex

npm install --frozen-lockfile


npm -s run clean
npm -s run prepare
npm -s run example

npm -s run coverage || true
npm -s run doc || true

npm -s run lint -- --format node_modules/eslint-formatter-checkstyle-* \
    > checkstyle-eslint.xml || true

exit 0
