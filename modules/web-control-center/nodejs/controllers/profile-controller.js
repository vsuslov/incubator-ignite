/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

controlCenterModule.controller('profileController', ['$scope', '$alert', '$http', function ($scope, $alert, $http) {
    
    $scope.editableUser = angular.copy($scope.savedUser);

    $scope.editField = null;

    $scope.showInfo = function (msg) {
        if ($scope.alert)
            $scope.alert.hide();

        $scope.alert = $alert({
            type: 'success',
            title: msg,
            duration: 2
        });
    };

    $scope.$watch('editField', function(val) {
        if (!angular.equals($scope.editableUser, $scope.savedUser)) {
            $http.post('/profile/saveUser', $scope.editableUser).success(function(updatedUser) {
                angular.copy(updatedUser, $scope.savedUser);
                angular.copy(updatedUser, $scope.editableUser);

                $scope.showInfo('Profile has been updated');
            }).error(function(data) {
                $scope.showInfo('Failed to update profile: ' + data);
            });
        }
    });
    
}]);