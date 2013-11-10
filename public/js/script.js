var module = angular.module('App', ['ngRoute']);

module.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when("/gender", {
            templateUrl: "/partials/gender.html"
        })
        .when("/age", {
            templateUrl: "/partials/age.html"
        })
        .when("/where", {
            templateUrl: "/partials/where.html"
        })
		.otherwise({redirectTo: "/gender"});
}]);

angular.bootstrap(document.getElementById('App'), ['App']);