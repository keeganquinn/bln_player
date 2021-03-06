#!/usr/bin/env bash

# Automated build script. Intended for continuous integration use.

set -ex

npm install --frozen-lockfile


npm -s run clean
npm -s run prepack

npm -s test || true
npm -s run jsdoc || true
npm -s run pkglint || true

npm -s run lint -- --format node_modules/eslint-formatter-checkstyle-* \
    > checkstyle-eslint.xml || true

exit 0
