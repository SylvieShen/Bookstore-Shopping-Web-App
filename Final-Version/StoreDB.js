var MongoClient = require('mongodb').MongoClient; // require the mongodb driver

/**
 * Uses mongodb v3.1.9 - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.1/api/)
 * StoreDB wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our bookstore app.
 */
function StoreDB(mongoUrl, dbName) {
    if (!(this instanceof StoreDB)) return new StoreDB(mongoUrl, dbName);
    this.connected = new Promise(function(resolve, reject) {
        MongoClient.connect(
            mongoUrl, {
                useNewUrlParser: true
            },
            function(err, client) {
                if (err) reject(err);
                else {
                    console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
                    resolve(client.db(dbName));
                }
            }
        )
    });
}

StoreDB.prototype.getProducts = function(queryParams) {
    var query = {};
    return this.connected.then(function(db) {
        return new Promise(function(resolve, reject) {
            if (queryParams.minPrice != undefined && queryParams.maxPrice != undefined) {
                query.price = {
                    "$gte": parseInt(queryParams.minPrice),
                    "$lte": parseInt(queryParams.maxPrice)
                };

            } else if (queryParams.minPrice != undefined) {
                query.price = {
                    "$gte": parseInt(queryParams.minPrice)
                };
            } else if (queryParams.maxPrice != undefined) {
                query.price = {
                    "$lte": parseInt(queryParams.maxPrice)
                };
            }

            if (queryParams.category != undefined) {
                query.category = { "$eq": queryParams.category };
            }

            db.collection("products").find(query).toArray(function(err, result) {
                if (err) reject(err);
                else {
                    var newResult = {};
                    for (var i = 0; i < result.length; i++) {
                        var id = result[i]["_id"];
                        newResult[id] = result[i];
                        delete newResult[id]["_id"];
                    }
                }
                resolve(newResult);

            });

        })
    })


}
StoreDB.prototype.addOrder = function(order) {
    return this.connected.then(function(db) {

        return new Promise(function(resolve, reject) {
            if (order.client_id == undefined || order.client_id == null || typeof(order.client_id) != "string") {
                reject("Client_id Error!");
            }
            if (order.cart == undefined || order.cart == null || typeof(order.cart) != "object" || JSON.stringify(order.cart) == '{}') {
                reject("Cart Error!");
            }
            if (order.total == undefined || order.total == null || typeof(order.total) != "number") {
                reject("Total Error!");
            }
            db.collection("orders").insertOne(order, function(err, result) {
                if (err) reject(err);
                else {
                    resolve(result);
                }
            });
            for (itemName in order.cart) {
                var decrement = order.cart[itemName];
                var whereStr = { "_id": itemName };
                var updateStr = { $inc: { quantity: -decrement } };

                db.collection("products").updateOne(whereStr, updateStr, function(err, result) {
                    if (err) reject(err);
                    else {
                        resolve(result);
                    }
                });
            }
        })
    })
}

module.exports = StoreDB;