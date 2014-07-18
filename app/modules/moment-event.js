/**
 *
 *
 * Created on 18.07.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
"use strict";

angular.module('moment-event-service', [])
	.service('momentEvent', function(){
		var events = {},
			on = function(event, listener){
				if (!events[event]) events[event] = [];
				events[event].push(listener);

				return function remove(){
				    off(event, listener);
				}
			},
			off = function(event, listener){
				if (events[event]){
					var index = events[event].indexOf(listener);
					events[event].splice(index, 1);
				}
			},
			fire = function(event){
			    if (events[event]){
					var arg = arguments;
					angular.forEach(events[event], function(listener){
					    listener.apply(listener, arg);
					});
				}
			};


		return {
			on: on,
			off: off,
			fire: fire
		};
	})
;