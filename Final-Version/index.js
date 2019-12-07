// Require dependencies
var path = require('path');
var express = require('express');
var storedb = require('./StoreDB');
var db = new storedb('mongodb://localhost:27017/', 'cpen400a-bookstore');

// Declare application parameters
var PORT = process.env.PORT || 3000;
var STATIC_ROOT = path.resolve(__dirname, './public');

// Defining CORS middleware to enable CORS.
// (should really be using "express-cors",
// but this function is provided to show what is really going on when we say "we enable CORS")
function cors(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS,PUT");
    next();
}

// Instantiate an express.js application
var app = express();

// Configure the app to use a bunch of middlewares
app.use(express.json()); // handles JSON payload
app.use(express.urlencoded({ extended: true })); // handles URL encoded payload
app.use(cors); // Enable CORS

app.use('/', express.static(STATIC_ROOT)); // Serve STATIC_ROOT at URL "/" as a static resource

// Configure '/products' endpoint
app.get('/products', function(request, response) {
    var query = request.query;
    var getPromise = db.getProducts(query);
    getPromise.then(function(result) {
            response.status(200).send(JSON.stringify(result));
            console.log("Get products Success!");
        },
        function(err) {
            response.status(500).send(err);
            console.log("Get products Error!");
        }
    )
});
app.post('/checkout', function(request, response) {
    var order = request.body;
    var isError = false;
    if (order.client_id == undefined || order.client_id == null || typeof(order.client_id) != "string") {
        response.status(500).send("Client_id Error!");
        isError = true;
    }
    if (order.cart == undefined || order.cart == null || typeof(order.cart) != "object" || JSON.stringify(order.cart) == '{}') {
        response.status(500).send("Cart Error!");
        isError = true;
    }
    if (order.total == undefined || order.total == null || typeof(order.total) != "number") {
        response.status(500).send("Total Error!");
        isError = true;
    }
    if (!isError) {
        var getPromise = db.addOrder(order);
        getPromise.then(function(result) {
                response.status(200).send(JSON.stringify(result));
                console.log("Add order Success!");
            },
            function(err) {
                response.status(500).send(err);
                console.log("Add order Error!");
            })
    }


})


// Start listening on TCP port
app.listen(PORT, function() {
    console.log('Express.js server started, listening on PORT ' + PORT);
});