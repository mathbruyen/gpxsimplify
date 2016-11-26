'use strict';

import { Transform } from 'stream';
import { Buffer } from 'buffer';

/**
 * Extracts jekyll frontmatter to a different flow than actual content.
 *
 * TODO: automatically detect the pattern on the first chunk instead of asking for an option
 * TODO: match the pattern against ongoing buffer and directly write to output content which cannot match
 */
export default class ExtractFrontmatter extends Transform {

  constructor(options) {
    super(options);
    this._frontmatter = options.frontmatter;
    this.pending = Buffer.alloc(0);
  }

  _transform(chunk, encoding, callback) {
    if (this.pending) {
      this.pending = Buffer.concat([this.pending, chunk]);
      var str = this.pending.toString('utf-8');
      var match = /\r?\n---\s*\r?\n/.exec(str);
      if (match) {
        var frontmatter = str.substring(0, match.index) + match[0];
        var remain = str.substring(match.index + match[0].length);
        this._frontmatter.write(Buffer.from(frontmatter, 'utf-8'));
        this.push(Buffer.from(remain));
        delete this.pending;
      }
    } else {
      this.push(chunk);
    }
    callback();
  }

  _flush(callback) {
    if (this.pending) {
      console.error('Frontmatter: detection requested but content not found, ignoring but content was fully buffered.');
      this.push(this.pending);
    }
    callback();
  }

}
