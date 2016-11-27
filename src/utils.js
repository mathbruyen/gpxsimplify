'use strict';

export function haversine(a, b) {
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
