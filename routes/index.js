'use strict'

var express = require('express');
var router = express.Router();

var cardValidator = require('card-validator');
var validation = require('../public/js/validation');
var gateway = require('../lib/payment_gateway');
var order = require('../lib/order');

var config = require("config");

/* GET form */
router.get('/form', function(req, res, next) {
	res.render('form', {});
});

router.get('/check_form', function(req, res, next) {
	res.render('check_form', {});
});

router.get('/orders', function(req, res, next) {
	var params = {
		"name": req.query.customer_name,
		"refCode": req.query.ref_code
	};

	order.getOrder(req, res, params);
});

router.post("/checkout", function(req, res) {	
	//common field
	var params = getParams(req);
	console.log(params);
	//validate params
	var validate = validateParams(params);
	console.log('#######checkout here, validate: ' + validate);
	if (validate.errors.length > 0) {
		console.log('validate: ' + validate);
		//error occur
		res.send({
			"success": false,
			"err_msg": validate.errors.join("<br/>")
		});
		return;
	}

	params = validate.params;

	try {
		gateway.get(params.gatewayType).procced(req, res, params);
	} catch (err) {
		console.log('test here 12344: ' + err);
		res.send({
			"success": false,
			"err_msg": "Payment gateway not support!"
		});
	}
});

router.post("/paymentgateway/mocka", function(req, res) {
	//common field
	console.log('Trying to connect payment gateway MOCK A.');
	
	var gateway = config.get("gateway_mock_a");
	var resp = {};

	console.log('gateway.isActivated: ' + gateway.isActivated);

	if (gateway.isActivated) {
		var rn = require('random-number');
		var options = {
	  		min:  100000
	  		, max:  999999
			, integer: true
		}
		var refId = rn(options);
		refId = "A" + refId;
		console.log('@Variable: [refId]=' + refId);
		
		resp.success = true;
		resp.ref_id = refId;

	} else {
		resp.success = false;
		resp.err_msg = 'Payment gateway Mock A is not activated.';
	}

	res.json(resp);
});

router.post("/paymentgateway/mockb", function(req, res) {
	//common field
	console.log('Trying to connect payment gateway MOCK B.');

	var gateway = config.get("gateway_mock_b");
	var resp = {};

	if (gateway.isActivated) {
		var rn = require('random-number');
		var options = {
	  		min:  100000
	  		, max:  999999
			, integer: true
		}
		var refId = rn(options);
		refId = "B" + refId;

		resp.success = true;
		resp.ref_id = refId;
		
	} else {
		resp.success = false;
		resp.err_msg = 'Payment gateway Mock B is not adtivated.';
	}

	res.json(resp);
});

function getParams(req) {
	//common field
	var params = {};
	params.name = req.body.customer_name;
	params.phone = req.body.customer_phone;
	params.currency = req.body.currency;
	params.price = req.body.price;
	params.gatewayType = req.body.gateway;

	params.credit_card_name = req.body.credit_card_name;
	params.ccv = req.body.credit_card_ccv;
	params.credit_card_no = req.body.credit_card_no;
	params.credit_card_exp = req.body.credit_card_exp;
	var expire = params.credit_card_exp.split('/');
	if (expire.length === 2) {
		params.exp_year = expire[1];
		params.exp_month = expire[0];
	}

	var cardValid = cardValidator.number(params.credit_card_no);
	params.credit_card = cardValid;

	return params;
}

function validateParams(params) {
	var errors = [];

	if (params.name == '') {
		errors.push("Customer name required.");
	}
	
	if (params.currency == '') {
		errors.push("Currency required.");
	}
	
	if (!validation.validatePhone(params.phone)) {
		errors.push("Invalid phone number.");
	}
	
	if (isNaN(parseFloat(params.price))) {
		errors.push("Invalid price.");
	}
	
	if (!params.credit_card.isValid) {
		//credit card no invalid
		errors.push("Invalid credit card number.");
	}
	
	if (params.credit_card_name == '') {
		errors.push("Credit card name required.");
	}
	
	if (!validation.validateCCV(params.ccv)) {
		errors.push("Invalid credit card ccv.");
	}
	
	if (!validation.validateExpire(params.credit_card_exp)) {
		errors.push("Invalid credit card expiry date.");
	}

	return {
		"errors": errors,
		"params": params
	};
}

module.exports = router;