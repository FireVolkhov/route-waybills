/**
 *
 *
 * Created on 18.07.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
"use strict";

angular.module('routes-height-directive', ['ui.bootstrap.position', 'ng-if-event', 'moment-event-service'])
	.directive('routesHeight', ['$window', '$position', '$timeout', 'momentEvent', function($window, $position, $timeout, momentEvent){
		return{
			link: function(scope, elem, attrs){

				angular.element($window).on('resize', resize);

				var removeListener = momentEvent.on('routes-height-resize', resize);

				scope.$on('$destroy', function(){
					angular.element($window).off('resize', resize);
					removeListener();
				});

				resize();

				function resize(){
					var parent = elem.parent(),
						children = parent.children(),
						offset = $position.offset(parent).top,
						winOtherElementsHeight = 0,
						maxHeight;

					angular.forEach(children, function(element){
						if (element !== elem[0]){
							winOtherElementsHeight += $position.position(angular.element(element)).height;
						}
					});

					maxHeight = $window.innerHeight - offset * 2 - winOtherElementsHeight;

					elem.css({'max-height': maxHeight + 'px'});
				}
			}
		};
	}])
;