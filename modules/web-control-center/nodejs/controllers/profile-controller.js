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

controlCenterModule.controller('profileController', ['$scope', '$alert', '$http', 'commonFunctions',
    function ($scope, $alert, $http, commonFunctions) {
    
    $scope.profileUser = angular.copy($scope.loggedInUser);

    $scope.editField = null;

    $scope.showInfo = function (msg) {
        $scope.showAlert(msg, 'success');
    };

    $scope.showError = function (msg) {
        $scope.showAlert(msg, 'danger');
    };

    $scope.showAlert = function (msg, type) {
        if ($scope.alert)
            $scope.alert.hide();

        $scope.alert = $alert({
            type: type,
            title: msg,
            duration: 2
        });
    };

    $scope.saveUser = function() {
        if ($scope.profileUser) {
            var userName = $scope.profileUser.username;
            var oldPass = $scope.profileUser.oldPassword;
            var newPass = $scope.profileUser.newPassword;
            var confirm = $scope.profileUser.confirm;

            if (userName && oldPass && newPass && confirm &&
                userName.length > 0 && oldPass.length > 0 && newPass.length > 0 && confirm.length > 0 &&
                newPass == confirm
            ) {
                $http.post('/profile/changePassword', {
                    _id: $scope.editableUser._id,
                    pass: $scope.pass1
                }).success(function () {
                    $scope.showInfo('Profile saved.');
                }).error(function (err) {
                    $scope.showError('Failed to save profile: ' + commonFunctions.errorMessage(err));
                });
            }
        }
    };

    //$scope.$watch('editField', function(val) {
    //    if (!angular.equals($scope.editableUser, $scope.savedUser)) {
    //        $http.post('/profile/saveUser', $scope.editableUser).success(function(updatedUser) {
    //            angular.copy(updatedUser, $scope.savedUser);
    //            angular.copy(updatedUser, $scope.editableUser);
    //
    //            $scope.showInfo('Profile has been updated');
    //        }).error(function(err) {
    //            $scope.showError('Failed to update profile: ' + commonFunctions.errorMessage(err));
    //        });
    //    }
    //});
}]);