'use strict'
var mocka = require("./mock-a");
var mockb = require("./mock-b");

var gateway = {
	"gatewayA": mocka,
	"gatewayB": mockb
}

exports.get = function(gatewayName){
	console.log('@Variable: [gatewayName]='+gatewayName);
	return gateway[gatewayName];
}