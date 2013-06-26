//
// Sockly web application entrypoint
//
var app = angular.module('socklyweb', []);

app.config(function ($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'view/main.html',
			controller: 'MainCtrl'
		})
		.otherwise({
			redirectTo: '/'
		});
});
