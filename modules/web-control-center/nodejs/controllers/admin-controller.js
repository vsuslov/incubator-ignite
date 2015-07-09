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

controlCenterModule.controller('adminController', ['$scope', '$alert', '$http', 'commonFunctions', function ($scope, $alert, $http, commonFunctions) {
        $scope.userList = null;

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

        function reload() {
            $http.post('admin/list')
                .success(function (data) {
                    $scope.userList = data;
                })
                .error(function (errMsg) {
                    $scope.showError(commonFunctions.errorMessage(errMsg));
                });
        }

        reload();

        $scope.removeUser = function (user) {
            if (!confirm("Are you sure you want to delete user " + user.username + "?"))
                return false;

            $http.post('admin/remove', {userId: user._id}).success(
                function (data) {
                    reload();

                    $scope.showInfo("User has been removed: " + user.username);
                }).error(function (err) {
                    $scope.showError("Failed to remove user: " + commonFunctions.errorMessage(errMsg));
                });

            return false;
        };

        $scope.toggleAdmin = function (user) {
            if (user.adminChanging)
                return;

            user.adminChanging = true;

            $http.post('admin/save', {userId: user._id, adminFlag: user.admin}).success(
                function (data) {
                    reload();

                    adminChanging = false;
                }).error(function (errMsg) {
                    $scope.showError("Failed to remove user: " + commonFunctions.errorMessage(errMsg));

                    adminChanging = false;
                });
        }
    }]);