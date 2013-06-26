
angular.module('socklyweb')
	.controller('MenuCtrl', function($scope) {

		$scope.menuItems = [
			'Notifications',
			'Buckets',
			'Guages'
		];
	});