#!/bin/bash
# direct output to stderr
exec 1>&2

files_changed=$(git diff --cached --name-status | awk '$1 != "D" { print $2 }' | grep \.js$)
[[ $files_changed ]] && node_modules/.bin/eslint $files_changed
