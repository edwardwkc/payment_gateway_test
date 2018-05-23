'use strict'

var db = require("../db");
var cache = require("../cache");
var request = require('request');
var paymentGateway = {};

paymentGateway.procced = function(req, res, params) {
	console.log('Start to procced Mock Payment gateway B...');

	request({
		headers: {
      		'Content-Type': 'application/json'
    	},
    	uri: 'http://localhost:3001/paymentgateway/mockb',
    	method: 'POST'
    }
    , function (error, resp, body) {
		console.log('body: '+ body);
		var response = {};

		if (!error && resp.statusCode == 200) {
			var jsonObj = JSON.parse(body);
			
			if (jsonObj.success) {
				params.ref_code = jsonObj.ref_id;

				//store into db
				db.createOrder(params, function(dbErr, dbResult) {
					if (dbErr != null) {
						console.log(dbErr);
						response.success = false;
						response.err_msg = "Payment fail!";
					} else {
						//store to cache
						db.getOrder(params.name, params.ref_code, function(err, results, fields){
							cache.addOrder(results[0]);
						});

						response.success = true;
						response.payment_ref = jsonObj.ref_id;
					}

					res.send(response);
				});

			} else {
				response.err_msg = "Payment fail!";
				res.send(response);
			}

		} else {
			console.log('error: + ' + error);
		}	  
	});
}

module.exports = paymentGateway;
