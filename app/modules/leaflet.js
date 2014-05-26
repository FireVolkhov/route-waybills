/**
 *
 *
 * Created on 20.12.13.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */

angular
	.module('Leaflet', [])
	.value('leafletConfig', {
//		layerSrcUrl: 'http://mapserver.aldi-service.ru/osm/{z}/{x}/{y}.png',
		layerSrcUrl: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		attribution: '',
		maxZoom: 18,

		startCord: [55.15, 61.4],
		startZoom: 13
	})

	.directive('mapLeaflet', ['leafletConfig', function(leafletConfig){
		var config = angular.extend({}, leafletConfig || {});

		return {
			link: function (scope, elem, attrs){
				if (!attrs.id){
					elem.attr('id', 'map_' + Math.random());
				}

				scope.map = L.map(elem.attr('id'), { zoomControl: false }).setView(config.startCord, config.startZoom);

				L.tileLayer(config.layerSrcUrl , {
					attribution: config.attribution,
					maxZoom: config.maxZoom
				}).addTo(scope.map);
			}
		}
	}]);