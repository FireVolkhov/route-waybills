/**
 *
 *
 * Created on 14.07.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
"use strict";

/**
 * В папке лежит документ объесняющий общие принципы алгоритма
 * Shtovba_Ant_Algorithms_ExponentaPro_2003_3.pdf
 */
angular.module('ant-algorithms', [])
	.service('antAlgorithms', ['$timeout', '$q', function($timeout, $q){
		var algprithms = {};

		/**
		 * Вычисляет оптимальный маршрут
		 * @param {[[]]} distances Матрица расстояний
		 */
		algprithms.calc = function(distances){
			var defer = $q.defer(),
				i = 0,
				l = algprithms.iteration,
				anthill = new Anthill(distances);

			$timeout(iteration, algprithms.interval);

			return defer.promise;

			function iteration(){
				var startI = i,
					endI = startI + algprithms.countIterationInInterval;

				while(i < endI){
					anthill.calculateEdgesWeight();
					anthill.calculateAnts();
					anthill.evaporationPheromone();
					anthill.calculatePheromone();
					anthill.restartAnts();

					i ++;
				}

				if (i < l){
					defer.notify(i / l);
					$timeout(iteration, algprithms.interval);
				} else {
					defer.resolve(anthill.getOptimalRoute());
				}
			}
		};

		// Стартовый феромон
		algprithms.START_PHEROMONE = 0.5;

		// Важность феромона
		algprithms.alpha = 1;
		// Важность видимости
		algprithms.betta = 1;

		algprithms.iteration = 1000;
		algprithms.countIterationInInterval = 10;
		algprithms.interval = 5;

		algprithms.evaporation = 0.2;

		algprithms.elitAnts = 3;

		/**
		 * Муравей :)
		 * @constructor
		 */
		var Ant = function(startCity){
			this.tabuList = [];
			this.city = null;

			this.setStartCity(startCity);
		};

		Ant.prototype.setStartCity = function(number){
		    this.city = number;
			this.tabuList = [number];

			return this;
		};

		Ant.prototype.goToNextCity = function(weight){
			var thisCity = this.city,
				i, lastCity = weight.length,
				chanceVisitCity = [],
				tabuList = this.tabuList,
				allNotVisitedCityWeight = 0;

			i = lastCity;
			while(i --){
				if (tabuList.indexOf(i) > -1){
					chanceVisitCity[i] = 0;
				} else {
					chanceVisitCity[i] = 1;
					allNotVisitedCityWeight += weight[thisCity][i];
				}
			}

			i = lastCity;
			while(i --){
				if (chanceVisitCity[i]){
					chanceVisitCity[i] = weight[thisCity][i] / allNotVisitedCityWeight;
				}
			}

			this.goToCity(this._selectCity(chanceVisitCity));

			return this;
		};

		Ant.prototype.goToCity = function(number){
			this.city = number;
			this.tabuList.push(number);

			return this;
		};

		Ant.prototype.getRoute = function(){
		    return this.tabuList;
		};

		Ant.prototype._selectCity = function(chanceVisitCity){
		    var i = chanceVisitCity.length,
				chance,
				random = Math.random();

			while(i --){
				chance = chanceVisitCity[i];

				if (!chance) continue;
				random -= chance;
				if (random <= 0) break;
			}

			return i;
		};

		/**
		 * Муравейник :))
		 * @constructor
		 */
		var Anthill = function(distances){
			var i, l, j, k;

			this.distances = distances;
		    this.pheromone = [];
			this.visibility = [];
			this.weight = [];

			this.ants = [];
			this.routes = [];

			this.optimalRoute = null;
			this.optimalDistance = Number.MAX_VALUE;

			this._Q = 0;

			for(i = 0, l = distances.length; i < l; i++){
				k = distances[i].length;

				this.pheromone[i] = [];
				this.visibility[i] = [];
				this.weight[i] = [];

				this.ants.push(new Ant(i));

				for(j = 0; j < k; j++){
					if (i == j){
						this.pheromone[i][j] = 0;
						this.visibility[i][j] = 0;
					} else {
						this.pheromone[i][j] = algprithms.START_PHEROMONE;
						this.visibility[i][j] = 1 / distances[i][j] || 0;
					}
				}
			}
		};

		Anthill.prototype.getOptimalRoute = function(){
		    return this.optimalRoute;
		};

		Anthill.prototype.calculateEdgesWeight = function(){
			var i, l, j, k,
				pheromone = this.pheromone,
				visibility = this.visibility,
				weight = this.weight;

			for(i = 0, l = visibility.length; i < l; i++){
				k = visibility[i].length;
				for(j = 0; j < k; j++){
					weight[i][j] = this._calcEdgeWeight(pheromone[i][j], visibility[i][j]);
				}
			}
		};

		Anthill.prototype._calcEdgeWeight = function(pheromone, visibility){
		    return Math.pow(pheromone, algprithms.alpha) * Math.pow(visibility, algprithms.betta);
		};

		Anthill.prototype.calculateAnts = function(){
			var ants = this.ants,
				countCity = this.visibility.length,
				i = ants.length,
				j,
				weight = this.weight,
				route,
				distance;

		    while(i --){
				j = countCity - 1;
				while(j --){
					ants[i].goToNextCity(weight);
				}
			}

			i = ants.length;
			while(i --){
				route = ants[i].getRoute();
				distance = this._calcDistanceRoute(route);
				this.routes.push({
					patch: route,
					distance: distance
				});

				if (distance < this.optimalDistance){
					this.optimalRoute = route;
					this.optimalDistance = distance;
					if (!this._Q) this._Q = distance;
				}
			}
		};

		Anthill.prototype._calcDistanceRoute = function(route){
			var distance = 0,
				i, l,
				city = route[0],
				nextCity;

			for(i = 1, l = route.length; i < l; i++){
				nextCity = route[i];
				distance += this.distances[city][nextCity];
				city = nextCity;
			}

			return distance;
		};

		Anthill.prototype.calculatePheromone = function(){
		    var Q = this._Q,
				routes = this.routes,
				i = routes.length,
				route,
				pheromone;

			while(i --){
				route = routes[i];
				if (algprithms.elitAnts && route.distance == this.optimalDistance){
					pheromone = algprithms.elitAnts * Q / route.distance;
				} else {
					pheromone = Q / route.distance;
				}
				this._addPheromone(route.patch, pheromone);
			}

			this.routes = [];
		};

		Anthill.prototype._addPheromone = function(patch, pheromone){
			var i, l,
				city = patch[0],
				nextCity;

			for(i = 1, l = patch.length; i < l; i++){
				nextCity = patch[i];
				this.pheromone[city][nextCity] += pheromone;
				this.pheromone[nextCity][city] += pheromone;
				city = nextCity;
			}

			this.pheromone[city][0] += pheromone;
			this.pheromone[0][city] += pheromone;
		};

		Anthill.prototype.evaporationPheromone = function(){
			var countCity = this.distances.length,
				i = countCity,
				j;

		    while(i --){
				j = countCity;
				while(j --){
					this.pheromone[i][j] = this.pheromone[i][j] * (1 - algprithms.evaporation);
				}
			}
		};

		Anthill.prototype.restartAnts = function(){
			var i = this.ants.length;
		    while(i --){
				this.ants[i].setStartCity(i);
			}
		};

    	return algprithms;
	}])
;