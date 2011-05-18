(function () {
    "use strict";

    var connect = require('connect'),
        port = 21212;

    connect(
        connect.router(function (app) {
            app.get('/', function (req, res, next) {
                // we need to do this to avoid copying the js stuff...
                req.url = './examples/index.html';
                next();
            });
        }),
        connect.static('../')
    ).listen(port, function () {
        console.log('Server listening on port ' + port);
    });
}());
