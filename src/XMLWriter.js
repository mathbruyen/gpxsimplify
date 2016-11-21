'use strict';

import { Transform } from 'stream';

/**
 * Very basic no-validation XML generator from object stream.
 */
export default class XMLWriter extends Transform {

  constructor(options) {
    super(Object.assign({ objectMode : true }, options));
    this._indent = 0;
    this._closeOnNewLine = false;
  }

  _transform(chunk, encoding, callback) {
    if (chunk.type === 'processinginstruction') {
      this.push(`<?${chunk.name} ${chunk.body}?>`);
    } else if (chunk.type === 'text') {
      this.push(chunk.text);
    } else if (chunk.type === 'opentag') {
      var attr = this._buildAttributes(chunk.attributes);
      if (attr) {
        this.push(`\n${this._buildIndent()}<${chunk.name} ${attr}>`);
      } else {
        this.push(`\n${this._buildIndent()}<${chunk.name}>`);
      }
      this._closeOnNewLine = false;
      this._indent += 2;
    } else if (chunk.type === 'closetag') {
      this._indent -= 2;
      if (this._closeOnNewLine) {
        this.push(`\n${this._buildIndent()}</${chunk.name}>`);
      } else {
        this.push(`</${chunk.name}>`);
      }
      this._closeOnNewLine = true;
    } else {
      console.error('Unhandled chunk: ' + JSON.stringify(chunk));
    }
    callback();
  }

  _flush(callback) {
    callback();
  }

  _buildIndent() {
    return ' '.repeat(this._indent);
  }

  _buildAttributes(attributes) {
    return Object.keys(attributes).map(attr => `${attr}="${attributes[attr].value}"`).join(' ');
  }

}
