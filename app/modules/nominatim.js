/**
 *
 *
 * Created on 22.05.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
"use strict";

angular.module('nominatim', [])
	.service('nominatim', ['$http', function($http){
		var nominatim = {};

//		nominatim.url = "http://nominatim.aldi-service.ru/search.php";
		nominatim.url = "http://nominatim.openstreetmap.org/";
		nominatim.format = "json";
		nominatim.search = function(query){
			return $http.get(this.url + "search", {params: {
				q: query,
				format: this.format
			}}).then(function(result){
			    return result.data;
			});
		};
		nominatim.reverse = function(lat, lng){
			return $http.get(this.url + "reverse", {params: {
				lat: lat,
				lon: lng,
				format: this.format,
				"accept-language": "ru"
			}}).then(function(result){
				return result.data;
			});
		};

		return nominatim;
	}]);