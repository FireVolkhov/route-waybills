/**
 *
 *
 * Created on 04.07.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
"use strict";

angular.module('salesman', ['osrm', 'ant-algorithms'])
	.service('salesman', ['$q', 'osrm', 'underscore', 'antAlgorithms', function($q, osrm, underscore, antAlgorithms){
		var salesman = {};

		salesman.ZOOM = 15;

		salesman.calculate = function(route){
		    if (!angular.isArray(route.points)){
				throw new Error('Неверный параметр: ', route);
			}
			if (route.points.length < 3){
				return $q.when(route);
			}

			var start = underscore.now(),
				points = route.points.slice(0, route.closed ? -1 : undefined),
				promises = [],
				distances = [];

			angular.forEach(points, function(whence){
				var distancesForPoint = [];

			    angular.forEach(points, function(where, i){
			        if (whence == where){
						distancesForPoint[i] = 0;
					} else {
						promises.push(osrm.getRoute([whence, where], salesman.ZOOM).then(function(result){
							if (result && result.distances && result.distances.length > 0){
								distancesForPoint[i] = result.distances[0];
							}
						}));
					}
			    });

				distances.push(distancesForPoint);
			});

			return $q.all(promises)
				.then(function(){
					console.log('Время загрузки данных: ', underscore.now() - start);
					start = underscore.now();
				})
				.then(function(){
					return antAlgorithms.calc(distances);
				})
				.then(function(route){
					console.log('Время расчета: ', underscore.now() - start);
					start = underscore.now();
					return route;
				})
				.then(function(points){
					var i, l,
						result = {
							points: [],
							path: route.path,
							closed: route.closed
						};

					for(i = 0, l = points.length; i < l; i++){
						result.points.push(route.points[points[i]]);
					}

				    return result;
				});
		};

		return salesman;
	}])
;