/**
 *
 *
 * Created on 18.07.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
"use strict";

angular.module('routes-height-directive', ['ui.bootstrap.position', 'ng-if-event'])
	.directive('routesHeight', ['$window', '$position', '$timeout', function($window, $position, $timeout){
		return{
			link: function(scope, elem, attrs){

				angular.element($window).on('resize', resize);
				var removeListener = scope.$on('routes-height-resize', function(){
				    $timeout(resize);
				});

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