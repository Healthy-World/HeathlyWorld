var ext = {
	google: {
		geocoder: {
			/**
			 * Parses search results returned by Google geocoding service.
			 * To get more information see: https://developers.google.com/maps/documentation/geocoding/#Results
			 */
			parseSearchResults: function(results) {
				var locations = [];
				if (!results) {
					return locations;
				}

				for (var i = 0; i < results.length; i++) {
					var result = results[i];
					var location = {
						latitude: null,
						longitude: null,
						formattedAddress: null,
						streetNumber: null,
						street: null,
						postalBox: null,
						room: null,
						floor: null,
						country: null,
						province: null,
						postalCode: null,
						city: null
					};
					if (result.geometry && result.geometry.location) {
						location.latitude = result.geometry.location.lat();
						location.longitude = result.geometry.location.lng();
					}
					if (result.formatted_address) {
						location.formattedAddress = result.formatted_address;
					}
					for (var j = 0; j < result.address_components.length; j++) {
						var addressComponent = result.address_components[j];
						var longName = addressComponent.long_name;
						var short_name = addressComponent.short_name;
						for (var z = 0; z < addressComponent.types.length; z++) {
							var type = addressComponent.types[z];
							if ('street_number' === type) {
								location.streetNumber = longName;
							} else if (/^(street_address|route|intersection)$/.test(type)) {
								if (!location.street) {
									location.street = longName;
								}
							} else if ('post_box' === type) {
								location.postalBox = longName;
							} else if ('room' === type) {
								location.room = longName;
							} else if ('floor' === type) {
								location.floor = longName;
							} else if ('country' === type) {
								location.country = longName;
							} else if ('administrative_area_level_1' === type) {
								location.province = short_name;
							} else if ('postal_code' === type) {
								location.postalCode = longName;
							} else if (/^(locality|administrative_area_level_2)$/.test(type)) {
								if (!location.city) {
									location.city = longName;
								}
							}
						}
					}
					locations.push(location);
				}

				return locations;
			}
		},

		location: {
			constants: {
				GEOCODING_DELAY: 1000,

				bounds: {
					SOUTH_WEST_LAT: 23.241346,
					SOUTH_WEST_LNG: -138.718872,
					NORTH_EAST_LAT: 72.289067,
					NORTH_EAST_LNG: -61.199341
				}
			},

			initialize: function(input) {
				var googleSearchResultsCache = {};

				var disableLocationSearch = function() {
					input.prop('disabled', 'disabled')
						.prop('title', "Location service is not available now. You can update this field later.");
				};

				var processGeocoderResults = function(results, status) {
					// Geo coder response statuses:
					// ERROR, INVALID_REQUEST, OK, OVER_QUERY_LIMIT, REQUEST_DENIED, UNKNOWN_ERROR, ZERO_RESULTS
					var addressQuery = input.val();
					switch (status) {
						case google.maps.GeocoderStatus.OK:
							if (results.length > 1) {
								util.html.validationMessageProcessor(input, 'Please, enter more precise location.')
							} else {
								var location = ext.google.geocoder.parseSearchResults(results)[0];
								app.executeFieldUpdate(input, location);
							}
							if (!googleSearchResultsCache[addressQuery]) {
								googleSearchResultsCache[addressQuery] = results;
							}
							break;
						case google.maps.GeocoderStatus.ZERO_RESULTS:
							util.html.validationMessageProcessor(input, 'Entered location not exists.');
							break;
						case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
							disableLocationSearch();
							break;
						default:
							util.html.validationMessageProcessor(input, "We can't check this address. Could you change it again.");
							app.log().info("Error of geocoding '" + addressQuery + "' caused by " + status);
							break;
					}
				};

				var doAddressGeocoding = function() {
					var addressQuery = input.val();
					if (googleSearchResultsCache[addressQuery]) {
						processGeocoderResults(googleSearchResultsCache[addressQuery], google.maps.GeocoderStatus.OK);
					} else {
						googleGeoCoder.geocode({
							address: addressQuery,
							bounds: preferableSearchArea
						}, function(results, status) {
							processGeocoderResults(results, status);
						});
					}
				};

				var googleAutoComplete = null;
				var googleGeoCoder = null;
				var preferableSearchArea = null;
				try {
					// North America bounds are used.
					preferableSearchArea = new google.maps.LatLngBounds(
						new google.maps.LatLng(this.constants.bounds.SOUTH_WEST_LAT, this.constants.bounds.SOUTH_WEST_LNG),
						new google.maps.LatLng(this.constants.bounds.NORTH_EAST_LAT, this.constants.bounds.NORTH_EAST_LNG));
					googleAutoComplete = new google.maps.places.Autocomplete(input[0], {
						bounds: preferableSearchArea
					});
					googleGeoCoder = new google.maps.Geocoder();
				} catch (e) {
					app.log().error('Error of initializing Google maps API caused by ' + e);
				}

				if (googleGeoCoder == null) {
					disableLocationSearch();
				}

				var geoCodingTimeout = null;


				util.html.editableFieldProcessor(input, function() {
					if (googleGeoCoder) {
						if (geoCodingTimeout) {
							clearTimeout(geoCodingTimeout);
						}
						geoCodingTimeout = setTimeout(function() {
							doAddressGeocoding();
						}, ext.google.location.constants.GEOCODING_DELAY);
					}
				});
			}
		},

		map: {
			element: null,

			map: null,

			streetView: null,

			markerImage: null,

			initialize: function(mapId, coords) {
				if (!mapId || !coords || typeof(google) === 'undefined') return;

				var self = ext.google.map;

				var mapOptions = {
					zoom: 15,
					maxZoom: 17,
					minZoom: 12,
					streetViewControl: false,
					overviewMapControl: false,
					disableDoubleClickZoom: true,
					center: new google.maps.LatLng(coords.lat, coords.lng),
					mapTypeControlOptions: {
						mapTypeIds: []
					},
					disableDefaultUI: true,
					mapTypeControl: true,
					scaleControl: true,
					panControl: true,
					zoomControl: true,
					zoomControlOptions: {
						style: google.maps.ZoomControlStyle.LARGE
					},
					mapTypeId: google.maps.MapTypeId.ROADMAP
				};

				self.element = document.getElementById(mapId);
				self.map = new google.maps.Map(self.element, mapOptions);
				self.markerImage = new google.maps.MarkerImage('imgs/pin.png',
					new google.maps.Size(20, 32),
					new google.maps.Point(0, 0),
					new google.maps.Point(10, 31) // The anchor for this image is the base of the flagpole at 18,32.
				);

				self.streetView = self.map.getStreetView();
				self.streetView.setPosition(self.map.getCenter());
				self.streetView.setPov({
					heading: 265,
					pitch: 0
				});

				return self.map;
			},

			addHereMarker: function(coords) {
				if (!coords || typeof(google) === 'undefined') return;

				var self = this;

				var markerImage = new google.maps.MarkerImage('/imgs/person.png',
					new google.maps.Size(32, 32),
					new google.maps.Point(0, 0),
					new google.maps.Point(15, 30) // The anchor for this image is the base of the flagpole at 18,32.
				);

				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(coords.lat, coords.lng),
					map: self.map,
					draggable: true,
					title: 'You are here',
					icon: markerImage
				});
			},

			addMarker: function(coords, title) {
				if (!coords || typeof(google) === 'undefined') return;

				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(coords.lat, coords.lng),
					map: this.map,
					animation: google.maps.Animation.DROP,
					optimized: false,
					title: title || ''
				});

				this.markers.items.push(marker);
				return marker;
			},

			bounce: function(marker, times) {
				if (!marker || typeof(google) === 'undefined') return;

				times = times || 1;

				marker.setAnimation(google.maps.Animation.BOUNCE);
				setTimeout(function() {
					marker.setAnimation(null);
				}, 300 * times)
			},

			redraw: function() {
				if (typeof(google) === 'undefined') return;

				google.maps.event.trigger(this.map, 'resize');
			},

			addListener: function(obj, eventName, handler) {
				if (typeof(google) === 'undefined') return;

				google.maps.event.addListener(obj, eventName, handler);
			},

			setPosition: function(pos) {
				if (typeof(google) === 'undefined') return;

				this.map.panTo(pos);
				this.streetView.setPosition(pos);
			},

			$$toLatLng: function(latLng) {
				return {
					lat: latLng.lat(),
					lng: latLng.lng()
				};
			},

			getBounds: function() {
				var self = this;
				var bounds = self.map.getBounds();
				if (!bounds) return false;

				return {
					center: self.$$toLatLng(bounds.getCenter()),
					northEast: self.$$toLatLng(bounds.getNorthEast()),
					southWest: self.$$toLatLng(bounds.getSouthWest())
				};
			},

			route: {
				display: null,

				service: null,

				initialize: function(map) {
					if (this.service) return;

					this.service = new google.maps.DirectionsService();
					this.display = new google.maps.DirectionsRenderer({
						'map': map,
						'preserveViewport': true,
						'draggable': true
					});
				},

				clear: function() {
					if (!this.display) return;

					this.display.setMap(null);
				},

				to: function(map, origin, dest) {
					if (!map) return;

					var self = this;
					self.initialize(map);

					if (origin.lat && origin.lng)
						origin = util.strings.format('{lat},{lng}', origin);

					if (dest.lat && dest.lng)
						dest = util.strings.format('{lat},{lng}', dest);

					var request = {
						origin: origin,
						destination: dest,
						travelMode: google.maps.TravelMode.DRIVING
					};

					self.service.route(request, function(result, status) {
						if (status == google.maps.DirectionsStatus.OK) {
							self.display.setDirections(result);
							self.display.setMap(map);
						}
					});
				}
			},

			markers: {
				items: [],
				foreach: function(func) {
					for (var i = 0; i < this.items.length; i++) {
						func(this.items[i]);
					}
				},

				clear: function() {
					this.foreach(function(m) {
						m.setMap(null);
					});

					this.items = [];
				},

				hideAll: function() {
					this.foreach(function(m) {
						m.setVisible(false);
					});
				},

				showAll: function() {
					this.foreach(function(m) {
						m.setVisible(true);
					});
				}
			}
		}
	}
};