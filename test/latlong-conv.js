var latlong = require('../lib/latlong'),
    coordNE = {
        latitude: 30.5,
        longitude: 40.2
    },
    coordNW = {
        latitude: 30.5,
        longitude: -40.2
    },
    coordSE = {
        latitude: -30.5,
        longitude: 40.2
    },
    coordSW = {
        latitude: -30.5,
        longitude: -40.2
    };

console.log();
console.log("Original values:");
console.log();

console.log("NE:", coordNE);
console.log("NW:", coordNW);
console.log("SE:", coordSE);
console.log("SW:", coordSW);

console.log();
console.log();

console.log("UTM");
console.log();

console.log("NE:", latlong.toUtm(coordNE.latitude, coordNE.longitude));
console.log("NW:", latlong.toUtm(coordNW.latitude, coordNW.longitude));
console.log("SE:", latlong.toUtm(coordSE.latitude, coordSE.longitude));
console.log("SW:", latlong.toUtm(coordSW.latitude, coordSW.longitude));

console.log();
console.log();

console.log("MGRS");
console.log();

console.log("NE:", latlong.toMgrs(coordNE.latitude, coordNE.longitude));
console.log("NW:", latlong.toMgrs(coordNW.latitude, coordNW.longitude));
console.log("SE:", latlong.toMgrs(coordSE.latitude, coordSE.longitude));
console.log("SW:", latlong.toMgrs(coordSW.latitude, coordSW.longitude));
