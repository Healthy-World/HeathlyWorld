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

module.controller('LoadingCtrl', ['$scope', '$location', '$timeout',
	function($scope, $location, $timeout) {
		$scope.$on('$viewContentLoaded', function() {
			$timeout(function(){
				$location.path('results');
			}, 2000);
		});
	}
]);

module.controller('ResultsCtrl', ['$scope',
	function($scope) {
		$scope.doctors = [{
			"name": "Dr. Michael Lewis BSc, MD, CCFP",
			"gender": "M",
			"image": "http://stemmedcancer.com/wp-content/uploads/2011/10/Michael_Lewis-e1319515460190.jpg",
			"availability": {
				"Monday": "9am - 5pm",
				"Tuesday": "9am - 12pm",
				"Friday": "9am - 12pm"
			},
			"phone": "416-486-1956",
			"address": {
				"street": "200 St. Clair Ave. West Suite 110",
				"city": "Toronto",
				"prov": "ON",
				"postal": "M4V 1R1"
			},
			"reviews": [{
				"name": "",
				"rating": 2,
				"comments": "Dr. Lewis is good, but the person whop answers the phone and who you depend on to get an appointment, keep track of information, etc, is terrible. Her command of the english language isn't great, and results in a LOT of errors.",
				"attributes": {
					"staff": 1,
					"punctual": 2,
					"helpful": 3,
					"knowledge": 4
				}
			}]
		}, {
			"name": "Dr. Sharon Hind BScH, MD, CCFP",
			"gender": "F",
			"image": "http://nonprophetstatus.files.wordpress.com/2010/02/sharonwelch.jpg",
			"availability": {
				"Monday": "10am - 2pm",
				"Tuesday": "11am - 5pm",
				"Wednesday": "10am - 5pm"
			},
			"phone": "416-486-1956",
			"address": {
				"street": "200 St. Clair Ave. West Suite 110",
				"city": "Toronto",
				"prov": "ON",
				"postal": "M4V 1R1"
			},
			"reviews": [{
				"name": "",
				"rating": 5,
				"comments": "",
				"attributes": {
					"staff": 5,
					"punctual": 5,
					"helpful": 5,
					"knowledge": 5
				}
			}]
		}, {
			"name": "Dr. Sheeja Mathai",
			"gender": "F",
			"image": "http://www.soukya.com/images/drmathai2008.jpg",
			"availability": {},
			"phone": "647-722-2370",
			"address": {
				"street": "390 Steeles Avenue West",
				"city": "Vaughan",
				"prov": "ON",
				"postal": "L4J"
			},
			"reviews": []
		}, {
			"name": "Dr. Preston Tran",
			"gender": "M",
			"image": "http://blogs.worldbank.org/files/dmblog/Dr_%20Tran%20Triet.JPG",
			"phone": "647-722-2370",
			"address": {
				"street": "390 Steeles Avenue West",
				"city": "Vaughan",
				"prov": "ON",
				"postal": "L4J"
			},
			"reviews": [{
				"name": "",
				"rating": 3.6,
				"comments": "Wonderful doctor: respectful, skillful, thorough, takes time, cares. ",
				"attributes": {
					"staff": 4,
					"punctual": 4,
					"helpful": 5,
					"knowledge": 5
				}
			}]
		}];
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
			.otherwise({
				redirectTo: "/home"
			});
	}
]);

angular.bootstrap(document.getElementById('App'), ['App']);