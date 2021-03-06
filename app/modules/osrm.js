/**
 *
 *
 * Created on 22.05.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
"use strict";

angular.module('osrm', [])
	.service('osrm', ['$http', '$q', function($http, $q){
		var osrm = {};

//		osrm.url = "http://mapserver.aldi-service.ru/osm/";
		osrm.url = "http://router.project-osrm.org/viaroute";
		osrm.output = "json";
		osrm.countInOneRequvest = 2;
		osrm.countInOneRequvestForGpx = 25;
		osrm.zoomForGpx = 14;
		osrm.instructions = "true";

		osrm.getRoute = function(points, scale){
			var length = points.length,
				i = 0,
				promises = [];

			if (length > 1){
				while(i < length -1){
					promises.push(getRoute(points, i, scale));
					i += osrm.countInOneRequvest -1;
				}
			}

			return $q.all(promises).then(function(results){
				var result = {
					distances: [],
					total: 0,
					geometry: []
				};
				angular.forEach(results, function(val){
					if (val.route_summary){
						result.distances.push(val.route_summary.total_distance / 1000);
						result.total += val.route_summary.total_distance / 1000;
						result.geometry = result.geometry.concat(_decode(val.route_geometry));
					}
				});
				return result;
			});
		};

		osrm.getGpx = function(points){
			var length = points.length,
				i = 0,
				promises = [];

			if (points.length > 1){
				while(i < length -1){
					promises.push(getGpx(points, i));
					i += osrm.countInOneRequvestForGpx -1;
				}
			}

			return $q.all(promises).then(function(results){
				var result = "";
				angular.forEach(results, function(val){
					result = result.replace(/<\/rte>[\w\W]*/, "");
					val = (result)? val.replace(/[\w\W]*<rte>/, "") : val;
					result += val;
				});
				return result;
			});
		};

		return osrm;

		function getRoute(points, key, scale){
			var lenght, end, query, point;

			query = osrm.url + "?output=" + osrm.output + "&instructions=" + osrm.instructions + "&z=" + scale;

			for (lenght = points.length, end = key + osrm.countInOneRequvest; key < lenght && key < end; key ++){
				point = points[key];
				query += "&loc=" + point.coordinates.lat + "," + point.coordinates.lon;
			}

		    return $http.get(query, {}).then(function(result){
				return result.data;
			});
		}

		function getGpx(points, key){
			var lenght, end, query, point;

			query = osrm.url + "?output=gpx&instructions=" + osrm.instructions + "&z=" + osrm.zoomForGpx;

			for (lenght = points.length, end = key + osrm.countInOneRequvestForGpx; key < lenght && key < end; key ++){
				point = points[key];
				query += "&loc=" + point.coordinates.lat + "," + point.coordinates.lon;
			}

			return $http.get(query, {}).then(function(result){
				return result.data;
			});
		}

		function _decode(encoded) {
			var precision = 6;
			precision = Math.pow(10, -precision);
			var len = encoded.length, index=0, lat=0, lng = 0, array = [];
			while (index < len) {
				var b, shift = 0, result = 0;
				do {
					b = encoded.charCodeAt(index++) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);
				var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
				lat += dlat;
				shift = 0;
				result = 0;
				do {
					b = encoded.charCodeAt(index++) - 63;
					result |= (b & 0x1f) << shift;
					shift += 5;
				} while (b >= 0x20);
				var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
				lng += dlng;
				//array.push( {lat: lat * precision, lng: lng * precision} );
				array.push( [lat * precision, lng * precision] );
			}
			return array;
		}
	}]);