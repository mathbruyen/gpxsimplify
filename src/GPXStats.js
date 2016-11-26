'use strict';

import { Transform } from 'stream';

/**
 * Gathers GPX statistics.
 *
 * TODO: output to a stream (process.stdout) instead of to a function
 */
export default class GPXStats extends Transform {

  constructor(options) {
    super(Object.assign({ objectMode : true }, options));
    this._output = options.output;
    this._header = options.header;
    this._segments = [];
  }

  _transform(chunk, encoding, callback) {
    if (chunk.type === 'opensegment') {
      this._segment = { points : 0, distance : 0, last : null };
    } else if (chunk.type === 'closesegment') {
      this._segments.push(this._segment);
      delete this._segment;
    } else if (chunk.type === 'point') {
      this._segment.points++;
      if (this._segment.last) {
        this._segment.distance += this._distance(this._segment.last, chunk.point);
      }
      this._segment.last = chunk.point;
    }
    this.push(chunk);
    callback();
  }

  _flush(callback) {
    this._output(this._header);
    this._segments.forEach((segment, idx) => this._output(`${idx}: ${segment.points} points / ${Math.round(segment.distance)}m`));
    callback();
  }

  _distance(a, b) {
    // haversine distance
    var radius = 6371000 + ((a.ele + b.ele) / 2);
    var aLat = a.lat * Math.PI / 180;
    var aLon = a.lon * Math.PI / 180;
    var bLat = b.lat * Math.PI / 180;
    var bLon = b.lon * Math.PI / 180;
    var latDiff = (aLat - bLat) / 2;
    var lonDiff = (aLon - bLon) / 2;
    var i = Math.sin(latDiff) * Math.sin(latDiff) + Math.cos(aLat) * Math.cos(bLat) * Math.sin(lonDiff) * Math.sin(lonDiff);
    return 2 * radius * Math.atan2(Math.sqrt(i), Math.sqrt(1 - i));
  }

}
