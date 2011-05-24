var mgrs = require('../lib/mgrs');


if (process.argv.length === 3) {
    var ret = mgrs.toUtm(process.argv[2]);

    console.log(ret);
}

