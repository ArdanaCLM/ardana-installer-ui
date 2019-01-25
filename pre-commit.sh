#!/bin/bash
# direct output to stderr
exec 1>&2

files_changed=$(git diff --cached --no-renames --name-status --diff-filter=CMA HEAD | cut -f2 | grep '\.js$')
if [[ $files_changed ]]; then
  node_modules/.bin/eslint $files_changed
  exit $?
fi
