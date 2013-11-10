var module = angular.module('App', ['ngRoute']);

module.controller('TraitsCtrl', ['$scope',
	function($scope) {
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
	}
]);

module.controller('ResultsCtrl', ['$scope', '$http',
	function($scope, $http) {
		$scope.isEmptyObj = function(obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop))
					return false;
			}
			return true;
		}

		$http({ method: 'GET', url: '/api/doctors'})
			.success(function(data){
				$scope.doctors = data;
			});	
	}
]);

module.controller('LoadingCtrl', ['$scope', '$location', '$timeout',
	function($scope, $location, $timeout) {
		$scope.$on('$viewContentLoaded', function() {
			$timeout(function() {
				$location.path('results');
			}, 2000);
		});
	}
]);

module.controller('ProfileCtrl', ['$scope', '$location', '$timeout',
	function($scope, $location, $timeout) {
		$scope.$on('$viewContentLoaded', function() {

		});
	}
]);

module.config(['$routeProvider',
	function($routeProvider) {
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
				controller: 'TraitsCtrl',
				templateUrl: "/partials/traits.html"
			})
			.when("/where", {
				templateUrl: "/partials/where.html"
			})
			.when("/loading", {
				controller: 'LoadingCtrl',
				templateUrl: "/partials/progress.html"
			})
			.when("/results", {
				controller: 'ResultsCtrl',
				templateUrl: "/partials/results.html"
			})
			.when("/profile/:id", {
				controller: 'ProfileCtrl',
				templateUrl: "/partials/profile.html"
			})
			.otherwise({
				redirectTo: "/home"
			});
	}
]);

angular.bootstrap(document.getElementById('App'), ['App']);