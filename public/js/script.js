var module = angular.module('App', ['ngRoute']);

module.controller('ResultsCtrl', ['$scope', function($scope) {
    $scope.$on('$routeChangeStart', function(next, current) { 
    });
}]);

module.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when("/home", {
            templateUrl: "/partials/home.html"
        })
        .when("/gender", {
            templateUrl: "/partials/gender.html"
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
		.otherwise({redirectTo: "/home"});
}]);

angular.bootstrap(document.getElementById('App'), ['App']);
