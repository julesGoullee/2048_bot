/*global $*/
"use strict";

function EventHandler(){
	var self = this;

	var newEvent = function (name, data){
		return {
			'type' : name,
			'message' : data,
			'time' : new Date()
		};
	};

	self.notify = function (name, data){
		var objectEvent = newEvent(name, data);
		$.event.trigger(objectEvent);
	};

	self.listen = function (nameEvent, callback){

		function bindEvent (e){
			callback(e.message);
		}

		$(document).on(nameEvent, bindEvent);
	};

}

var Event = new EventHandler();
