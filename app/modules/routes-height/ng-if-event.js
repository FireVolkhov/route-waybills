/**
 *
 *
 * Created on 18.07.14.
 * @author FireVolkhov ( Sergey Gavrilov )
 * @mail FireVolkhov@gmail.com
 */
"use strict";

angular.module('ng-if-event', []).directive('ngIfEvent' ,['$animate', '$rootScope', function($animate, $rootScope) {
	function toBoolean(value) {
		if (typeof value === 'function') {
			value = true;
		} else if (value && value.length !== 0) {
			var v = angular.lowercase("" + value);
			value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
		} else {
			value = false;
		}
		return value;
	}

	/**
	 * Return the DOM siblings between the first and last node in the given array.
	 * @param {Array} array like object
	 * @returns {DOMElement} object containing the elements
	 */
	function getBlockElements(nodes) {
		var startNode = nodes[0],
			endNode = nodes[nodes.length - 1];
		if (startNode === endNode) {
			return angular.element(startNode);
		}

		var element = startNode;
		var elements = [element];

		do {
			element = element.nextSibling;
			if (!element) break;
			elements.push(element);
		} while (element !== endNode);

		return angular.element(elements);
	}

	return {
		transclude: 'element',
		priority: 600,
		terminal: true,
		restrict: 'A',
		$$tlb: true,
		link: function ($scope, $element, $attr, ctrl, $transclude) {
			var block, childScope, previousElements;
			$scope.$watch($attr.ngIfEvent, function ngIfWatchAction(value) {

				if (toBoolean(value)) {
					if (!childScope) {
						childScope = $scope.$new();
						$transclude(childScope, function (clone) {
							clone[clone.length++] = document.createComment(' end ngIf: ' + $attr.ngIf + ' ');
							// Note: We only need the first/last node of the cloned nodes.
							// However, we need to keep the reference to the jqlite wrapper as it might be changed later
							// by a directive with templateUrl when its template arrives.
							block = {
								clone: clone
							};
							$animate.enter(clone, $element.parent(), $element, function(){
							    if ($attr.broadcastEvent){
									$rootScope.$broadcast($attr.broadcastEvent, clone);
									$rootScope.$broadcast($attr.broadcastEvent + '-add', clone);
								}
							});
						});
					}
				} else {
					if(previousElements) {
						previousElements.remove();
						previousElements = null;
					}
					if(childScope) {
						childScope.$destroy();
						childScope = null;
					}
					if(block) {
						previousElements = getBlockElements(block.clone);
						$animate.leave(previousElements, function() {
							if ($attr.broadcastEvent){
								$rootScope.$broadcast($attr.broadcastEvent, previousElements);
								$rootScope.$broadcast($attr.broadcastEvent + '-remove', previousElements);
							}
							previousElements = null;
						});
						block = null;
					}
				}
			});
		}
	};
}]);