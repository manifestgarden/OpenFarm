openFarmModule.factory('gardenService', ['$http','alertsService',
  function gardenService($http, alertsService) {

    // Should return Garden model:
    // {
    //   id: '',
    //   name: '',
    //   location: '',
    //   ...
    //   garden_crops: [],
    //
    // }

    var buildGarden = function(data, included) {
      var gardenCropIds
      var pictures
      var garden = data.attributes;
      garden.id = data.id;
      gardenCropIds = data.relationships.garden_crops.data.map(function(gc) {
        return gc.id;
      })
      garden.relationships = data.relationships;
      garden.garden_crops = findGardenCrops(gardenCropIds, included) || [];
      if (included) {
        pictures = included.filter(function(obj) {
          return obj.type === 'pictures';
        }).map(function(pic) {
          return pic.attributes;
        })
      }

      garden.pictures = pictures || [];
      return garden;
    }

    var findGardenCrops = function(gardenCropIds, included) {
      if (included) {
        var garden_crops = included.filter(function(obj) {
          return (obj.type === 'garden-crops' &&
                  gardenCropIds.indexOf(obj.id) !== -1);
        }).map(function(garden_crop) {
          return buildGardenCrop(garden_crop);
        });
      }
      return garden_crops || [];
    }

    var buildGardenCrop = function(data) {
      var gardenCrop = data.attributes;
      gardenCrop.id = data.id;
      gardenCrop.links = data.links;
      return gardenCrop;
    }

    var buildParams = function(gardenObject) {
      gardenObject.relationships = null;
      gardenObject.links = null;
      var data = {
        type: 'gardens',
        id: gardenObject.id,
        attributes: gardenObject,
        images: gardenObject.pictures ? gardenObject.pictures.filter(function(p) {
          return !p.deleted;
        }) : [],
      }
      return data;
    }

    var getGardensForUser = function(user, callback) {
      var url = user.relationships.gardens.links.related;
      $http.get(url)
        .success(function (response, code) {
          var gardens = response.data.map(function(garden) {
            return buildGarden(garden, response.included);
          });
          return callback(true, gardens, code);
        })
        .error(function (response, code) {
          alertsService.pushToAlerts(response, code)
          if (callback) {
            return callback(false, response, code);
          }
        })
    }

    var saveGarden = function(garden, callback){
      var url = '/api/v1/gardens/' + garden.id;
      var data = buildParams(garden);
      // var data = {
      //   images: garden.pictures ? garden.pictures.filter(function(p){
      //     return !p.deleted;
      //   }) : [],
      //   garden: {
      //     description: garden.description || null,
      //     type: garden.type || null,
      //     location: garden.location || null,
      //     average_sun: garden.average_sun || null,
      //     ph: garden.ph || null,
      //     soil_type: garden.soil_type || null
      //   }
      // };
      $http.put(url, {'data': data})
        .success(function (response, object) {
          alertsService.pushToAlerts(['Updated your garden!'], '200');
          if (callback) {
            return callback(true, response, object);
          }
        })
        .error(function (response, code){
          console.error('error saving garden', response);
          alertsService.pushToAlerts(response.errors, code);
          if (callback){
            return callback(false, response, code);
          }
        });
    };

    var createGarden = function(garden, callback){
      var url = '/api/v1/gardens';
      var data = {
        images: garden.pictures ? garden.pictures.filter(function(p){
          return !p.deleted;
        }) : [],
        id: garden.id || null,
        attributes: {
          name: garden.name,
          description: garden.description || null,
          type: garden.type || null,
          location: garden.location || null,
          average_sun: garden.average_sun || null,
          ph: garden.ph || null,
          soil_type: garden.soil_type || null
        }
      };
      $http.post(url, { data: data })
        .success(function (response, status) {
          alertsService.pushToAlerts(['Created Your Garden!'], status)
          if (callback){
            return callback(true,
                            buildGarden(response.data, response.included),
                            status);
          }
        })
        .error(function (response, code){
          alertsService.pushToAlerts(response, code);
          if (callback){
            return callback(false, response.errors, code);
          }
        });
    };

    var saveGardenCrop = function(garden, gardenCrop, callback){
      var data = { 'data': { 'attributes': gardenCrop }}
      var url = gardenCrop.links.self.api;
      $http.put(url, data)
        .success(function (response, object) {
          alertsService.pushToAlerts(['Saved your garden crop!'], '200')
          if (callback){
            return callback(true, response, object);
          }
        })
        .error(function (response, code){
          alertsService.pushToAlerts(response, status)
          if (callback){
            return callback(false, response, code);
          }
        });
    };

    // Because garden crops can be added as a guide or as a crop
    // the `object` is the ambigious choice of either.
    var addGardenCropToGarden = function(garden, 
                                          adding, 
                                          object, 
                                          callback){
      var data = { 'data': {'attributes': {}}};
      data.data.attributes[adding] = object.id;
      var url = garden.relationships.garden_crops.links.related;
      console.log(data);
      $http.post(url, data)
        .success(function(response, object){
          alertsService.pushToAlerts(['Added crop to garden!'], '200')
          if (callback){
            return callback(true, buildGardenCrop(response.data), object);
          }
        })
        .error(function(response, code){
          if (response.errors) {
            var errors = response.errors.map(function(e) { return e.title });
          }
          alertsService.pushToAlerts(errors, code)
          if (callback){
            // TODO: We need to make these consistent. What do these functions
            // return?
            // Answer: Promises!
            return callback(false, response, code);
          }
        });
    };

    var deleteGardenCrop = function(garden, gardenCrop, callback){
      var url = gardenCrop.links.self.api;
      $http.delete(url)
        .success(function(response, object){
          alertsService.pushToAlerts(['Deleted crop.'], status)
          if (callback){
            return callback(true, response, object);
          }
        })
        .error(function(response, code){
          alertsService.pushToAlerts(response, code);
          if (callback){
            return callback(false, response, code);
          }
        });
    };

    var deleteGarden = function(garden, callback){
      var url = '/api/v1/gardens/' + garden.id;
      $http.delete(url)
        .success(function(response, object) {
          alertsService.pushToAlerts(['Deleted garden.'], status)
          if (callback){
            return callback(true, response, object);
          }
        })
        .error(function(response, code) {
          alertsService.pushToAlerts(response.errors, code);
          if (callback){
            return callback(false, response, code);
          }
        });
    };
    return {
      'utilities': {
        'buildGarden': buildGarden,
        'buildParams': buildParams
      },
      'getGardensForUser': getGardensForUser,
      'saveGarden': saveGarden,
      'createGarden': createGarden,
      'deleteGarden': deleteGarden,
      'saveGardenCrop': saveGardenCrop,
      'addGardenCropToGarden': addGardenCropToGarden,
      'deleteGardenCrop': deleteGardenCrop
    };
}]);

openFarmModule.directive('addToGardens', ['$rootScope', 'gardenService',
  function($rootScope, gardenService) {
    return {
      restrict: 'A',
      scope: {
        cropObject: '=',
        objectType: '=',
        user: '=user',
      },
      link: function(scope, element, attr){

        scope.$watch('user', function() {
          if (scope.user && scope.gardens === undefined) {
            scope.gardens = {};
            gardenService.getGardensForUser(scope.user,
              function(success, response, code) {
                if(success) {
                  scope.gardens = response;
                  scope.gardens.forEach(function(garden) {
                    var gardenCropCropIds = garden.garden_crops.map(
                      function(gc) {
                        if (scope.objectType == 'guide' && gc.guide !== null) {
                          return gc.guide.id
                        } else if (gc.crop !== null) {
                          return gc.crop.id;
                        }
                      })
                    if (gardenCropCropIds.indexOf(scope.cropObject.id) !== -1) {
                      garden.added = true;
                    }
                  });
                }
              });
          }
        })

        scope.toggleGarden = function(garden){
          garden.adding = true;
          if (!garden.added){
            var callback = function(success){
              if (success){
                garden.adding = false;
                garden.added = true;
              }
            };
            gardenService.addGardenCropToGarden(garden,
              scope.objectType,
              scope.cropObject,
              callback);
          } else {
            // gardenService.deleteGardenCrop(garden,
            //   scope.gardenCrop,
            //   function(){
            //     garden.adding = false;
            //     garden.added = false;
            //   });
          }
        };
      },
      templateUrl: '/assets/templates/_add_to_gardens.html'
    }
  }]);

openFarmApp.directive('addCrop', ['$http', 
                                  '$rootScope', 
                                  'cropService', 
                                  'gardenService',
  function addCrop($http, $rootScope, cropService, gardenService) {
    return {
      restrict: 'A',
      scope: {
        cropOnSelect: '=',
        gardenQuery: '=',
        query: '=',
        user: '=',
        objectType: '=',
      },
      controller: ['$scope', '$element', '$attrs',
        function ($scope, $element, $attrs) {
          $scope.placeholder = $attrs.placeholder || 'Search crops';
          $scope.buttonValue = $attrs.buttonValue || 'Submit';
          $scope.firstCrop = undefined;
          $scope.finalCrop = undefined;
          $scope.crops = undefined;
          $scope.garden = undefined;
          
          //Typeahead search for crops
          $scope.getCrops = function (val) {
            // be nice and only hit the server if
            // length >= 3
            return $http.get('/api/v1/crops', {
              params: {
                filter: val
              }
            }).then(function(res) {
              var crops = [];
              crops = res.data.data;
              if (crops.length === 0 && $scope.allowNew) {
                crops.push({ attributes: {
                  name: val,
                  is_new: true
                } });
              }
              crops = crops.map(function(crop) {
                return cropService.utilities.buildCrop(crop, res.data.included);
              });
              $scope.firstCrop = crops[0];
              $scope.crops = crops;
              return crops;
            })
          };

                  function acallback(success, response) {
                   $scope.user.gardens.forEach(function(garden){
                        if(garden === $scope.gardenQuery) {
                          garden.garden_crops.push({ 
                            'crop':response.crop, 
                            'guide': response.guide, 
                            'sowed':response.sowed, 
                            'stage':response.stage, 
                            'quantity':response.quantity 
                          });
                        }
                   });
                  }

          //Typeahead search for crops
          //cropSearch.getCrops("tomato");
          $scope.addCropToGarden = function () {
            $scope.crops1 = $scope.getCrops($scope.cropQuery);
            var cropi;
            if($scope.crops1) {
            for (cropi in $scope.crops) {
              if($scope.crops[cropi].name == $scope.cropQuery.name) {
                gardenService.addGardenCropToGarden($scope.gardenQuery, 
                                                    $scope.objectType, 
                                                    $scope.cropQuery, acallback);
                }
                if($scope.crops[cropi].name == $scope.cropQuery) {
                  $scope.finalCrop = cropService.utilities.buildParams($scope.crops[cropi]);
                  gardenService.addGardenCropToGarden($scope.gardenQuery, 
                                                    $scope.objectType, 
                                                    $scope.cropQuery, acallback);
                  }
                }
            }
          }

        }
      ],
      templateUrl: '/assets/templates/_add_crop_to_garden.html',
    };
}])
