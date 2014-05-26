/**
 *
 *
 * Created on 22.05.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
"use strict";

angular.module('point', ['underscore', 'nominatim'])
	.factory('Point', ['underscore', 'nominatim', function(underscore, nominatim){
		var Point;

		Point = function(map, lat, lon){
			var point = this;

		    this.address = "";
			this.coordinates = {
				lat: null,
				lon: null
			};
			this.marker = null;
			this.edit = true;

			this._map = map;
			this._changeListeners = [];

			this._debounceGetNominatim = underscore.debounce(function(){
			    return point._getNominatim();
			}, 500);
			this._debounceReverse = underscore.debounce(function(){
			    return point.reverse();
			}, 500);

			if (lat && lon){
				this.coordinates.lat = lat;
				this.coordinates.lon = lon;
				this._createMarker();
			}
		};

		Point.prototype.reverse = function(){
			var point = this;

			this.address = this.coordinates.lat + ", " + this.coordinates.lon;
			this._addOnMap();
			return nominatim.reverse(this.coordinates.lat, this.coordinates.lon).then(function(result){
			    point.address = result.display_name;
			});
		};

		Point.prototype.change = function(callback){
			this._debounceGetNominatim().then(callback);
		};

		Point.prototype.setCoordinates = function(lat, lon){
			if (lat && lon){
				this.coordinates.lat = lat;
				this.coordinates.lon = lon;
				this._createMarker(true);
			}
		};

		Point.prototype.remove = function(){
		    this._removeMarker();
			this.coordinates.lat = null;
			this.coordinates.lon = null;
		};

		Point.prototype.onChangeEvent = function(fun){
		    if (angular.isFunction(fun)){
				this._changeListeners.push(fun);
			}
		};

		Point.prototype.removeChangeEvent = function(fun){
		    var index = this._changeListeners.indexOf(fun);
			if (index > -1){
				this._changeListeners.splice(index, 1);
			}
		};

		Point.prototype.clone = function(){
		    return new Point(this._map, this.coordinates.lat, this.coordinates.lon);
		};

		Point.prototype.addOnMap = function(map){
		    if (this._map != map){
				this._removeMarker();
				this._map = map;
				this._addOnMap(true);
			}
		};

		Point.prototype._getNominatim = function(){
			var point = this,
				query = this.address;

			if (query){
				return nominatim.search(query).then(function(result){
					if (query == point.address){
						if (result.length){
							point.setCoordinates(result[0].lat, result[0].lon);
						} else {
							point.remove();
						}
					}
				}).catch(function(){
					point.remove();
				});
			} else {
				this.remove();
			}
		};

		Point.prototype._removeMarker = function(){
			if (this.marker && this._map){
				this._map.removeLayer(this.marker);
				this.marker = null;
			}
		};

		Point.prototype._createMarker = function(panTo){
			var point = this,
				latLon = [this.coordinates.lat, this.coordinates.lon];

			if (this.marker){
				this.marker.setLatLng(latLon);
				if (panTo){
					this._panTo();
				}
			} else {
				this.marker = L.marker(latLon, {draggable: true});
				this.marker.on('drag', drag);
				this.marker.on('dragend', drag);

				this._addOnMap();
			}

			function drag(){
			    var ll = point.marker.getLatLng();
				point.coordinates.lat = ll.lat;
				point.coordinates.lon = ll.lng;
				point._debounceReverse();
				point._fireChangeEvent();
			}
		};

		Point.prototype._addOnMap = function(panTo){
			if (this.marker && this._map && this.address){
				this.marker.addTo(this._map);
				if (panTo){
					this._panTo();
				}
			}
		};

		Point.prototype._panTo = function(){
		    if (this._map){
				this._map.panTo([this.coordinates.lat, this.coordinates.lon]);
			}
		};

		Point.prototype._fireChangeEvent = function(){
			var point = this;
		    angular.forEach(this._changeListeners, function(val){
				(val || angular.noop)(point);
		    });
		};

		return Point;
	}]);