var module = angular.module('App', ['ngRoute']);

module.controller('ResultsCtrl', ['$scope', function($scope) {

}]);

module.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when("/gender", {
            templateUrl: "/partials/gender.html"
        })
        .when("/home", {
            templateUrl: "/partials/home.html"
        })
        .when("/age", {
            templateUrl: "/partials/age.html"
        })
        .when("/traits", {
            templateUrl: "/partials/traits.html"
        })
        .when("/where", {
            templateUrl: "/partials/where.html"
        })
		.otherwise({redirectTo: "/gender"});
}]);

angular.bootstrap(document.getElementById('App'), ['App']);
