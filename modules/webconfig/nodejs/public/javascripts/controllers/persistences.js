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

configuratorModule.controller('persistenceController', ['$scope', '$alert', '$http', 'commonFunctions', function ($scope, $alert, $http, commonFunctions) {
        $scope.joinTip = commonFunctions.joinTip;

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

                var restoredItem = angular.fromJson(sessionStorage.persistenceBackupItem);

                if (restoredItem) {
                    var idx = _.findIndex($scope.persistences, function (persistence) {
                        return persistence._id == restoredItem._id;
                    });

                    if (idx >= 0)
                        $scope.selectedItem = $scope.persistences[idx];

                    $scope.backupItem = restoredItem;
                }

                $scope.$watch('backupItem', function (val) {
                    if (val)
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

        $scope.data = {
            curTableIdx: -1,
            curFieldIdx: -1,
            tables: [
                {schemaName: 'Schema1', use: true},
                {schemaName: 'Schema1', use: true, tableName: 'Table1', keyClass: 'KeyClass1', valueClass: 'ValueClass1',
                    fields: [
                        {use: true, key: true, ak: true, dbName: 'name1', dbType: 'dbType1', javaName: 'javaName1', javaType: 'javaType1'},
                        {use: true, key: false, ak: false, dbName: 'name2', dbType: 'dbType2', javaName: 'javaName2', javaType: 'javaType2'},
                        {use: false, key: false, ak: false, dbName: 'name3', dbType: 'dbType3', javaName: 'javaName3', javaType: 'javaType3'}
                    ]
                },
                {schemaName: 'Schema2', use: false},
                {schemaName: 'Schema2', use: false, tableName: 'Table2', keyClass: 'KeyClass2', valueClass: 'ValueClass2',
                    fields: [
                        {use: true, key: true, ak: true, dbName: 'name4', dbType: 'dbType4', javaName: 'javaName4', javaType: 'javaType4'},
                        {use: true, key: false, ak: false, dbName: 'name5', dbType: 'dbType5', javaName: 'javaName5', javaType: 'javaType5'},
                        {use: false, key: false, ak: false, dbName: 'name6', dbType: 'dbType6', javaName: 'javaName6', javaType: 'javaType6'}
                    ]},
                {schemaName: 'Schema2', use: false, tableName: 'Table3', keyClass: 'KeyClass3', valueClass: 'ValueClass3',
                    fields: [
                        {use: true, key: true, ak: true, dbName: 'name7', dbType: 'dbType7', javaName: 'javaName7', javaType: 'javaType7'},
                        {use: true, key: false, ak: false, dbName: 'name8', dbType: 'dbType8', javaName: 'javaName8', javaType: 'javaType8'},
                        {use: false, key: false, ak: false, dbName: 'name9', dbType: 'dbType9', javaName: 'javaName9', javaType: 'javaType9'}
                    ]}]
        };

        $scope.curTableIdx = -1;
    }]
);
