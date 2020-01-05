#!/usr/bin/env bash

# Automated build script. Intended for continuous integration use.

set -ex

yarn install --frozen-lockfile --ignore-scripts


yarn -s clean
yarn -s prepare

yarn -s test || true
yarn -s jsdoc || true
yarn -s jsonlint || true
yarn -s pkglint || true

yarn -s lint --format node_modules/eslint-formatter-checkstyle-* \
     > checkstyle-eslint.xml || true

exit 0
