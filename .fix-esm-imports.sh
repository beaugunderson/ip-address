#!/bin/sh

# Search for "from './baz'" and transform to "from './baz.js'"
find dist/esm -type f -name *.js -exec sed -i -e -E "s/from '(\.\/.*)'/from '\1.js'/g" {} \;