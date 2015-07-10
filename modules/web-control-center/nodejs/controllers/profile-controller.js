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

controlCenterModule.controller('profileController', ['$scope', '$http', 'commonFunctions', function ($scope, $http, commonFunctions) {
    $scope.profileUser = angular.copy($scope.loggedInUser);

    $scope.saveUser = function() {
        var profile = $scope.profileUser;

        if (profile) {
            var userName = profile.username;
            var changeUsername = userName != $scope.loggedInUser.username;

            var email = profile.email;
            var changeEmail = email != $scope.loggedInUser.email;

            if (changeUsername || changeEmail || profile.changePassword) {
                $http.post('/profile/saveUser', {
                    _id: profile._id,
                    userName: changeUsername ? userName : undefined,
                    email: changeEmail ? email : undefined,
                    newPassword: profile.changePassword ? profile.newPassword : undefined
                }).success(function () {
                    commonFunctions.showInfo('Profile saved.');

                    if (changeUsername)
                        $scope.loggedInUser.username = userName;

                    if (changeEmail)
                        $scope.loggedInUser.email = email;
                }).error(function (err) {
                    commonFunctions.showError('Failed to save profile: ' + commonFunctions.errorMessage(err));
                });
            }
        }
    };
}]);