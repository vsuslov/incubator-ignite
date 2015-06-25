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

configuratorModule.controller('persistenceController', ['$scope', '$alert', '$http', function ($scope, $alert, $http) {
        $scope.databases = [
            {value: 'oracle', label: 'Oracle database'},
            {value: 'db2', label: 'IBM DB2'},
            {value: 'mssql', label: 'MS SQL Server'},
            {value: 'postgre', label: 'PostgreSQL'},
            {value: 'mysql', label: 'MySQL'},
            {value: 'h2', label: 'H2 database'}
        ];

        $scope.connection = [];

        $http.get('/form-models/persistence.json')
            .success(function (data) {
                $scope.connection = data.connection;
            });

        $scope.persistences = [];

        // When landing on the page, get persistences and show them.
        $http.get('/rest/persistences')
            .success(function (data) {
                $scope.spaces = data.spaces;
                $scope.persistences = data.persistences;

                $scope.backupItem = angular.fromJson(sessionStorage.persistenceBackupItem);

                $scope.$watch('backupItem', function (val) {
                    sessionStorage.persistenceBackupItem = angular.toJson(val);
                }, true);
            });

        $scope.selectItem = function (item) {
            $scope.selectedItem = item;
            $scope.backupItem = angular.copy(item);
        };

        // Add new persistence.
        $scope.createItem = function () {
            $scope.backupItem = {database: 'oracle'};
            $scope.backupItem.space = $scope.spaces[0]._id;
        };

        // Save persistence in db.
        $scope.saveItem = function () {
            var item = $scope.backupItem;

            $http.post('/rest/persistences/save', item)
                .success(function (_id) {
                    var i = _.findIndex($scope.persistences, function (persistence) {
                        return persistence._id == _id;
                    });

                    if (i >= 0)
                        angular.extend($scope.persistences[i], item);
                    else {
                        item._id = _id;

                        $scope.persistences.push(item);
                    }

                    $scope.selectItem(item);
                })
                .error(function (errorMessage) {
                    $alert({title: errorMessage});
                });
        };

        $scope.removeItem = function () {
            var _id = $scope.selectedItem._id;

            $http.post('/rest/persistences/remove', {_id: _id})
                .success(function () {
                    var i = _.findIndex($scope.persistences, function (persistence) {
                        return persistence._id == _id;
                    });

                    if (i >= 0) {
                        $scope.persistences.splice(i, 1);

                        $scope.selectedItem = undefined;
                        $scope.backupItem = undefined;
                    }
                })
                .error(function (errorMessage) {
                    $alert({title: errorMessage});
                });
        };
    }]
);
