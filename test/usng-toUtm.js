var usng = require('../lib/usng');


if (process.argv.length === 3) {
    var ret = usng.parseUsng(process.argv[2]);
    ret = usng.toUtm(ret.zoneNumber, ret.zoneLetter, ret.sq1, ret.sq2, ret.east, ret.north);

    console.log(ret);
}

