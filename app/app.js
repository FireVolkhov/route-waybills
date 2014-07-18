/**
 *
 *
 * Created on 21.05.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */

(function(angular){
	"use strict";

	angular.module('waybills', ['underscore', 'Leaflet', 'osrm', 'nominatim', 'point', 'file-saver', 'salesman', 'routes-height-directive'])
		.controller('mainCtrl', ['underscore', '$scope', '$timeout', '$window', '$location', 'osrm', 'nominatim', 'Point', 'saveAs', 'salesman', function(underscore, $scope, $timeout, $window, $location, osrm, nominatim, Point, saveAs, salesman){
			var debounceFinishChange = underscore.debounce(finishChange, 150),
				setCoordinatesForChildren,
				greenIcon = L.icon({
					iconUrl: 'app/libs/images/marker-icon-green.png',
					shadowUrl: 'app/libs/images/marker-shadow.png',
					iconSize:     [25, 41], // size of the icon
					shadowSize:   [41, 41], // size of the shadow
					iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
					shadowAnchor: [12, 41]
				}),
				blueIcon = L.icon({
					iconUrl: 'app/libs/images/marker-icon.png',
					shadowUrl: 'app/libs/images/marker-shadow.png',
					iconSize:     [25, 41], // size of the icon
					shadowSize:   [41, 41], // size of the shadow
					iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
					shadowAnchor: [12, 41]
				});

			$scope.route = {
				points: [],
				closed: true
			};
			$scope.map = {};
			$scope.gpx = "";

			$scope.percent = 0;
			$scope.calculate = false;

			$timeout(function(){
				new L.Control.Zoom({ position: 'topright' }).addTo($scope.map);

				$scope.map.on('click', function(event){
					if ($scope.route.closed) offClosed();
					var point = new Point($scope.map, event.latlng.lat, event.latlng.lng);
					point.setIcon(blueIcon);
					point.reverse();
					point.onChangeEvent(debounceFinishChange);
					point.marker.on('click', function(){
					    $scope.deletePoint(point);
					});

					$scope.route.points.push(point);
					if ($scope.route.closed) onClosed();
					debounceFinishChange();
				});

				$scope.map.on('zoomend', function(event){
					debounceFinishChange();
				});

				$scope.newPoint = new Point($scope.map);

				angular.forEach($location.$$search, function(val, key){
					var point;

				    if (key == "address" && val){
						point = new Point($scope.map);
						point.address = val;
						point.change();
						$scope.addPoint(point);
					}
					if (key == "city" && val){
						nominatim.prefix = val;
					}
				});
			});

			$scope.$watch('route.closed', function(val){
			    if (angular.isDefined(val)){
					if (val){
						onClosed();
					} else {
						offClosed();
					}
				}
			});

			$scope.addPoint = function(point){
				if ($scope.route.closed) offClosed();
				point.setIcon(blueIcon);
				$scope.route.points.push(point);
				if ($scope.route.closed) onClosed();
				$scope.newPoint = new Point($scope.map);

				point.onChangeEvent(debounceFinishChange);
				debounceFinishChange();
			};

			$scope.up = function(point){
				var points = $scope.route.points,
					index = points.indexOf(point);

				if (index > -1){
					if ($scope.route.closed) offClosed();

					if (index == 0){
						swap(points, index, points.length -1);
					} else {
						swap(points, index, index -1);
					}

					if ($scope.route.closed) onClosed();
					debounceFinishChange();
				}
			};

			$scope.down = function(point){
				var points = $scope.route.points,
					index = points.indexOf(point);

				if (index > -1){
					if ($scope.route.closed) offClosed();

					if (index == points.length -1){
						swap(points, index, 0);
					} else {
						swap(points, index, index +1);
					}

					if ($scope.route.closed) onClosed();
					debounceFinishChange();
				}
			};

			$scope.deletePoint = function(point){
				var index = $scope.route.points.indexOf(point);

			    point.remove();
				if (index > -1){
					if ($scope.route.closed) offClosed();
					$scope.route.points.splice(index, 1);
					point.removeChangeEvent(debounceFinishChange);
					if ($scope.route.closed) onClosed();
				}

				debounceFinishChange();
			};

			$scope.deleteRoute = function(){
				if ($scope.route.closed) offClosed();
			    angular.forEach($scope.route.points, function(val){
			        val.removeChangeEvent(debounceFinishChange);
					val.removeChangeEvent(setCoordinatesForChildren);
					val.remove();
			    });
				$scope.route.points = [];
				if ($scope.route.closed) onClosed();
				debounceFinishChange();
			};

			$scope.change = function(point){
			    point.change(debounceFinishChange);
			};

			$scope.changeNewPoint = function(point){
				point.setIcon(greenIcon);
				$scope.change(point);
			};

			$scope.close = function(){
				$window.document.body.fireEvent('cancel', $window.document.createEventObject());
			};

			$scope.ok = function(){
				osrm.getGpx($scope.route.points).then(function(result){
					$scope.gpx = result;
					$timeout(function(){
						$window.document.body.fireEvent('complete', $window.document.createEventObject());
					});
				});
			};

			$scope.save = function(){
				osrm.getGpx($scope.route.points).then(function(result){
					saveAs(
						new $window.Blob([result], {type: "text/plain;charset=" + $window.document.characterSet}),
							new Date().toLocaleString().replace(" ", "_") + ".gpx"
					);
					$scope.gpx = result;
				});
			};

			$scope.optimizeRoute = function(){
				if (!$scope.calculate){
					$scope.calculate = true;

					salesman.calculate($scope.route)
						.then(function(route){
							$scope.route = route;
							debounceFinishChange();
							if (route.closed) {
								offClosed();
								onClosed();
							}
						}, null, function(percent){
							$scope.percent = Math.round(percent * 100);
						})
						.finally(function(){
							$scope.percent = 0;
							$scope.calculate = false;
						});
				}
			};

			function onClosed(){
				var parent, point;

			    if ($scope.route.points.length){
					parent = $scope.route.points[0];
					point = parent.clone();

					setCoordinatesForChildren = function(){
						point.coordinates = parent.coordinates;
					};

					parent.onChangeEvent(setCoordinatesForChildren);
					point.edit = false;
					$scope.route.points.push(point);

					debounceFinishChange();
				}
			}

			function offClosed(){
			    angular.forEach($scope.route.points, function(val, key){
			        if (val.edit === false){
						$scope.route.points.splice(key, 1);
						val.removeChangeEvent(debounceFinishChange);
						val.removeChangeEvent(setCoordinatesForChildren);

						debounceFinishChange();
					}
			    });
			}

			function finishChange(){
				osrm.getRoute($scope.route.points, $scope.map.getZoom()).then(function(result){
					angular.extend($scope.route, result);
					if ($scope.route.path){
						$scope.map.removeLayer($scope.route.path);
					}

					$scope.route.path = new L.Polyline($scope.route.geometry, {
						color: 'blue',
						weight: 5,
						smoothFactor: 1
					}).addTo($scope.map);
				});
			}

			function swap(array, x, y){
				var tmp = array[x];

				array[x] = array[y];
				array[y] = tmp;

				return array;
			}
		}])

		.directive('ngEnter', function () {
			return function (scope, element, attrs) {
				element.bind("keydown keypress", function (event) {
					if(event.which === 13) {
						scope.$apply(function (){
							scope.$eval(attrs.ngEnter);
						});

						event.preventDefault();
					}
				});
			};
		});
})(angular);