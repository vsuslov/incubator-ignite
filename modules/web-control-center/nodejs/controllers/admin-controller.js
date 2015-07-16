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

controlCenterModule.controller('adminController', ['$scope', '$http', '$confirm', 'commonFunctions', function ($scope, $http, $confirm, commonFunctions) {
    $scope.users = null;

    function reload() {
        $http.post('admin/list')
            .success(function (data) {
                $scope.users = data;
            })
            .error(function (errMsg) {
                commonFunctions.showError(commonFunctions.errorMessage(errMsg));
            });
    }

    reload();

    $scope.removeUser = function (user) {
        $confirm.show('Are you sure you want to remove user: "' + user.username + '"?').then(function () {
            $http.post('admin/remove', {userId: user._id}).success(
                function () {
                    var i = _.findIndex($scope.users, function (u) {
                        return u._id == user._id;
                    });

                    if (i >= 0)
                        $scope.users.splice(i, 1);

                    commonFunctions.showInfo('User has been removed: "' + user.username + '"');
                }).error(function (errMsg) {
                    commonFunctions.showError('Failed to remove user: "' + commonFunctions.errorMessage(errMsg) + '"');
                });
        });
    };

    $scope.toggleAdmin = function (user) {
        if (user.adminChanging)
            return;

        user.adminChanging = true;

        $http.post('admin/save', {userId: user._id, adminFlag: user.admin}).success(
            function () {
                commonFunctions.showInfo('Admin right was successfully toggled for user: "' + user.username + '"');

                user.adminChanging = false;
            }).error(function (errMsg) {
                commonFunctions.showError('Failed to toggle admin right for user: "' + commonFunctions.errorMessage(errMsg) + '"');

                user.adminChanging = false;
            });
    }
}]);