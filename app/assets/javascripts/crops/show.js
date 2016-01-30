openFarmApp.controller('showCropCtrl', ['$scope', '$http', 'cropService', '$timeout',
  'gardenService', 'userService',
  function newGuideCtrl($scope,
                        $http,
                        cropService,
                        gardenService,
                        userService,
                        $interval) {
    $scope.alerts = [];
    $scope.s3upload = '';
    $scope.crop = {};
    $scope.userId = USER_ID || undefined;

    $scope.setCurrentUser = function(object){
      $scope.currentUser = object;
    };


    var queryingFunction;
    $scope.setCrop = function(success, crop){
      userService.getUserWithPromise($scope.userId)
        .then($scope.setCurrentUser);

      $scope.crop = crop;

      if ($scope.crop.processing_pictures > 0) {
        $scope.processingPictures = true;
        queryingFunction = $interval(function() {
          $http.get('/api/v1/progress/pictures/crop/' + crop.id)
            .then(function(result) {
              if (result === 0) {
                console.log('stop querying')
                $scope.stopQuerying();
              } else {
                console.log('do nothing');
              }
            });
        }, 2000)
      }
    };

    $scope.stopQuerying = function() {
      console.log('canceling interval');
      $interval.cancel(queryingFunction);
      cropService.getCrop($scope.crop.id, $scope.setCrop);
    }

    cropService.getCrop(getIDFromURL('crops'), $scope.setCrop);
  }]);
