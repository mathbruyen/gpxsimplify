'use strict';

import { Transform } from 'stream';
import sax from 'sax';

/**
 * XML reader as object stream.
 */
export default class XMLReader extends Transform {

  constructor(options) {
    super(Object.assign({ objectMode : true }, options));
    this._parser = sax.parser(true, { xmlns : true, trim : true });
    this._parser.ontext = text => this.push({ type : 'text', text });
    this._parser.onprocessinginstruction = ({ name, body }) => this.push({ type : 'processinginstruction', name, body });
    this._parser.onopentag = ({ name, attributes }) => this.push({ type : 'opentag', name, attributes });
    this._parser.onclosetag = name => this.push({ type : 'closetag', name });
    this._parser.oncomment = text => this.push({ type : 'comment', text });
  }

  _transform(chunk, encoding, callback) {
    this._parser.write(chunk.toString('utf-8'));
    callback();
  }

  _flush(callback) {
    this._parser.close();
    this._parser.on('end', callback);
  }

}
