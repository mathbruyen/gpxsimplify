'use strict';

import { Transform } from 'stream';
import { Buffer } from 'buffer';

const HORIZONTAL_TAB = 9;
const LINE_FEED = 10;
const VERTICAL_TAB = 11;
const CARRIAGE_RETURN = 13;
const SPACE = 32;
const HYPHEN = 45;

/**
 * Extracts jekyll frontmatter to a different flow than actual content.
 *
 * Frontmatter "regexp":
 *  - start : $---\s+\n
 *  - end : \n---\s+\n
 */
export default class ExtractFrontmatter extends Transform {

  constructor(options) {
    super(options);
    this._frontmatter = options.frontmatter;
    this._log = options.log;
    this._detecting = Buffer.alloc(0);
  }

  _transform(chunk, encoding, callback) {
    if (this._detecting) {
      this._detecting = Buffer.concat([this._detecting, chunk]);
      const detected = this._hasFrontMatter();
      if (detected.has > 0) {
        this._log('Jekyll frontmatter detected');
        this._frontmatter.write(this._detecting.slice(0, detected.has + 1));
        this._reading = this._detecting.slice(detected.has + 1);
        delete this._detecting;
      } else if (!detected.can) {
        this.push(this._detecting);
        delete this._detecting;
      }
    } else if (this._reading) {
      this._reading = Buffer.concat([this._reading, chunk]);
      const detected = this._hasFrontMatterEnd();
      if (detected.has) {
        this._frontmatter.write(this._reading.slice(0, detected.has + 1));
        this.write(this._reading.slice(detected.has + 1));
        delete this._reading;
      } else if (detected.safe > 0) {
        this._frontmatter.write(this._reading.slice(0, detected.safe));
        this._reading = this._reading.slice(detected.safe);
      }
    } else {
      this.push(chunk);
    }
    callback();
  }

  _flush(callback) {
    if (this._detecting) {
      this.push(this._detecting);
    } else if (this._reading) {
      this._log('Jekyll frontmatter beginning was found, but not its end');
      this.push(this._reading);
    }
    callback();
  }

  _hasFrontMatter() {
    for (var [idx, value] of this._detecting.entries()) {
      if (idx < 3) {
        if (value !== HYPHEN) {
          return { has : -1, can : false };
        }
      } else {
        if (!this._isBlankCharacter(value)) {
          return { has : -1, can : false };
        }
        if (value === LINE_FEED) {
          return { has : idx, can : true };
        }
      }
    }
    return { has : -1, can : true };
  }

  _hasFrontMatterEnd() {
    // TODO build more general stream matcher?
    var lineFeedCompletes = false;
    var whiteSpaceAllowed = false;
    var hyphenAllowed = false;
    var hyphens = 0;
    var safe = 0;
    for (var [idx, value] of this._reading.entries()) {
      if (value === LINE_FEED) {
        if (lineFeedCompletes) {
          return { has : idx, safe : 0 };
        } else {
          lineFeedCompletes = false;
          whiteSpaceAllowed = false;
          hyphenAllowed = true;
          hyphens = 0;
          safe = idx - 1;
        }
      } else if (value === HYPHEN) {
        if (hyphenAllowed) {
          hyphens++;
          if (hyphens === 3) {
            lineFeedCompletes = true;
            hyphenAllowed = false;
          } else if (hyphens > 3) {
            lineFeedCompletes = false;
            whiteSpaceAllowed = false;
            hyphenAllowed = false;
            hyphens = 0;
            safe = idx - 1;
          }
        } else {
          lineFeedCompletes = false;
          whiteSpaceAllowed = false;
          hyphenAllowed = false;
          hyphens = 0;
          safe = idx - 1;
        }
      } else if (this._isBlankCharacter(value)) {
        if (!whiteSpaceAllowed) {
          lineFeedCompletes = false;
          whiteSpaceAllowed = false;
          hyphenAllowed = false;
          hyphens = 0;
          safe = idx - 1;
        }
      } else {
        lineFeedCompletes = false;
        whiteSpaceAllowed = false;
        hyphenAllowed = false;
        hyphens = 0;
        safe = idx - 1;
      }
    }
    return { has : -1, safe };
  }

  _isBlankCharacter(value) {
    return value === HORIZONTAL_TAB || value === SPACE || value === CARRIAGE_RETURN || value === LINE_FEED || value === VERTICAL_TAB;
  }

}
