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
        var profile = $scope.profileUser;

        if ($scope.profileUser) {
            var userName = profile.username;
            var email = profile.email;
            var oldPassword = profile.oldPassword;
            var newPassword = profile.newPassword;
            var confirmPassword = profile.confirmPassword;

            var changeUsername = userName && userName.length > 0 && userName != $scope.loggedInUser.username;
            var changeEmail = email && email.length > 0 && email != $scope.loggedInUser.email;

            var changePassword = profile.changePassword && oldPassword && newPassword && confirmPassword &&
                oldPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0 && newPassword == confirmPassword;

            if (changeUsername || changeEmail || changePassword) {
                $http.post('/profile/saveUser', {
                    _id: profile._id,
                    changeUsername: changeUsername,
                    userName: userName,
                    changeEmail: changeEmail,
                    email: email,
                    changePassword: changePassword,
                    oldPassword: oldPassword,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                }).success(function () {
                    $scope.showInfo('Profile saved.');

                    if (changeUsername)
                        $scope.loggedInUser.username = userName;
                }).error(function (err) {
                    $scope.showError('Failed to save profile: ' + commonFunctions.errorMessage(err));
                });
            }
        }
    };
}]);