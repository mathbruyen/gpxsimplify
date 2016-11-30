'use strict';

const EventEmitter = require('events');

export function haversine(a, b) {
  // TODO better handle elevation in the distance
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

class StateMachine extends EventEmitter {

  constructor(defaultState, states) {
    super();
    this._state = defaultState;
    this._states = states;
  }

  read(buffer) {
    for (var [idx, value] of buffer.entries()) {
      const transitions = this._states[this._state];
      this._state = transitions[value] || transitions.default;
      this.emit(`enter${this._state}`, buffer, idx, value);
    }
  }

}

export class StateMachineBuilder {

  constructor(defaultState) {
    this._defaultState = defaultState;
    this._states = {};
  }

  addState(state, defaultTransition) {
    this._states[state] = { 'default' : defaultTransition };
    return this;
  }

  addTransition(from, value, to) {
    if (!this._states[from]) {
      throw new Exception(`Missing state ${from} in ${JSON.stringify(this._states)}`);
    }
    this._states[from] = Object.assign(this._states[from], { [value] : to });
    return this;
  }

  build() {
    if (!this._states[this._defaultState]) {
      throw new Exception(`Missing default state ${this._defaultState} in ${JSON.stringify(this._states)}`);
    }
    return new StateMachine(this._defaultState, JSON.parse(JSON.stringify(this._states)));
  }

}
