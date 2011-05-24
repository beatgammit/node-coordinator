var mgrs = require('../lib/mgrs'),
    latLong = require('../lib/latlong'),
    usng = require('../lib/usng'),
    start = "18SUJ2348306479",
    tLatLong = usng.toLatLong(start),
    east = .5,
    north = .5,
    bearing = Math.atan(north, east) * 180 / Math.PI,
    dist = Math.sqrt(Math.pow(north, 2) + Math.pow(east, 2)),
    ret = mgrs.translate(start, north, east),
    newLL = latLong.translate(tLatLong.latitude, tLatLong.longitude, dist, bearing);

console.log("Bearing:", bearing);
console.log("Dist:", dist);

console.log("LatLong start:", tLatLong);
console.log("LatLong start formatted:", latLong.toDegMinSec(tLatLong.latitude, tLatLong.longitude));

console.log("LatLong result:", newLL);
console.log("LatLong result:", latLong.toDegMinSec(newLL.latitude, newLL.longitude));

console.log(ret);
