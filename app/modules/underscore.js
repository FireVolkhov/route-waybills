/**
 *
 *
 * Created on 25.04.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
(function () {
	"use strict";
	angular.module('underscore', [])
		.service('underscore',['$q', '$timeout', function($q, $timeout){
			var _ = {},
				breaker = {},

				ArrayProto = Array.prototype,
				ObjProto = Object.prototype,

				hasOwnProperty = ObjProto.hasOwnProperty,

				nativeMap = ArrayProto.map,
				nativeForEach = ArrayProto.forEach,
				nativeKeys = Object.keys;

			_.each = _.forEach = function(obj, iterator, context) {
				if (obj == null) return obj;
				if (nativeForEach && obj.forEach === nativeForEach) {
					obj.forEach(iterator, context);
				} else if (obj.length === +obj.length) {
					for (var i = 0, length = obj.length; i < length; i++) {
						if (iterator.call(context, obj[i], i, obj) === breaker) return;
					}
				} else {
					var keys = _.keys(obj);
					for (var i = 0, length = keys.length; i < length; i++) {
						if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
					}
				}
				return obj;
			};

			/**
			 * Вернет новый массив, полученный преобразованием каждого элемента list в функции (iterator).
			 * Если метод map реализован нативно, будет вызван именно он. Если list — JavaScript-объект,
			 * аргументами функции iterator будут (value, key, list).
			 * @type {collect}
			 */
			_.map = _.collect = function(obj, iterator, context) {
				var results = [];
				if (obj == null) return results;
				if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
				_.each(obj, function(value, index, list) {
					results.push(iterator.call(context, value, index, list));
				});
				return results;
			};

			/**
			 * Вернет версию функции, исполнение которой начнется не ранее, чем истечет промежуток wait, после ее последнего
			 * вызова. Полезно для реализации логики, которая зависит от завершения действий пользователя. Например, проверить
			 * орфографию комментария пользователя лучше будет после того, как он его окончательно введет, а динамечески
			 * перерассчитать разметку после того, как пользователь закончит изменять размер окна.
			 *
			 * Если передать true в качестве аргумента immediate функция будет выполнена сразу, не дожидаяся прошествия wait.
			 * Полезно в случаях когда нужно предоствратить повторные действия, например отправку формы.
			 */
			_.debounce = function(func, wait, immediate) {
				var defer, context, result, timestamp, timeout, args, later;

				later = function() {
					var promise,
						last = _.now() - timestamp;

					if (last < wait && last > 0) {
						timeout = $timeout(later, wait - last);
					} else {
						timeout = null;
						if (!immediate) {
							result = func.apply(context, args);
							context = args = null;
							if (result){
								if(result.$promise && result.$promise.finally){
									promise = result.$promise;
								} else if(result.finally){
									promise = result;
								}
							}

							if(promise){
								promise.finally(function(result){
									defer.resolve(result);
									defer = null;
								});
							} else {
								defer.resolve(result);
								defer = null;
							}
						}
					}
				};

				return function(){
					context = this;
					args = arguments;
					timestamp = _.now();
					var callNow = immediate && !timeout;

					if (!defer){
						defer = $q.defer();
					}

					if (!timeout) {
						timeout = $timeout(later, wait);
					}

					if (callNow) {
						result = func.apply(context, args);
						context = args = null;
					}

					return callNow ? result : defer.promise;
				};
			};

			_.keys = function(obj) {
				if (!_.isObject(obj)) return [];
				if (nativeKeys) return nativeKeys(obj);
				var keys = [];
				for (var key in obj) if (_.has(obj, key)) keys.push(key);
				return keys;
			};

			_.isObject = function(obj) {
				return obj === Object(obj);
			};

			_.has = function(obj, key) {
				return hasOwnProperty.call(obj, key);
			};

			/**
			 * Вернет текущую метку времени (Interger), используя самую быструю доступную в текущей среде выполнения функцию.
			 * Полезно при реализации таймеров/анимаций.
			 */
			_.now = Date.now || function() {
				return new Date().getTime();
			};

			return _;
		}]);
})();