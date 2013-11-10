var module = angular.module('App', ['ngRoute']);

module.controller('TraitsCtrl', ['$scope', function($scope) {
	$scope.traits = {
		experience: false,
		availability: false,
		location: false,
		attentiveness: false,
		education: false,
		reputation: false,
	};

	$scope.canProceed = false;
	$scope.toggleSelected = function(trait) {
		$scope.traits[trait] = !$scope.traits[trait];
		
		var count = 0;
		for (property in $scope.traits) {
			if ($scope.traits[property]) count++;
		}
		$scope.canProceed = (count == 3);
	};
}]);

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
        	controller: 'TraitsCtrl',
            templateUrl: "/partials/traits.html"
        })
        .when("/where", {
            templateUrl: "/partials/where.html"
        })
		.otherwise({redirectTo: "/gender"});
}]);

angular.bootstrap(document.getElementById('App'), ['App']);
