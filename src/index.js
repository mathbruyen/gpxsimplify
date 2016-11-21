'use strict';

import minimist from 'minimist';
import ExtractFrontmatter from './ExtractFrontmatter';
import XMLReader from './XMLReader';
import XMLWriter from './XMLWriter';

var argv = minimist(process.argv.slice(2));
var input = process.stdin;
var output = process.stdout;

if (argv.frontmatter) {
  input = input.pipe(new ExtractFrontmatter({ frontmatter : output }), { end : true });
}
input.pipe(new XMLReader())/* TODO transformation */.pipe(new XMLWriter()).pipe(output);
