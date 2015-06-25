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

configuratorModule.controller('cachesController', ['$scope', '$alert', '$http', 'commonFunctions', function ($scope, $alert, $http, commonFunctions) {
        $scope.addSimpleItem = commonFunctions.addSimpleItem;
        $scope.addDetailSimpleItem = commonFunctions.addDetailSimpleItem;
        $scope.swapSimpleItems = commonFunctions.swapSimpleItems;
        $scope.joinTip = commonFunctions.joinTip;

        $scope.atomicities = [
            {value: 'ATOMIC', label: 'ATOMIC'},
            {value: 'TRANSACTIONAL', label: 'TRANSACTIONAL'}
        ];

        $scope.modes = [
            {value: 'PARTITIONED', label: 'PARTITIONED'},
            {value: 'REPLICATED', label: 'REPLICATED'},
            {value: 'LOCAL', label: 'LOCAL'}
        ];

        $scope.atomicWriteOrderModes = [
            {value: 'CLOCK', label: 'CLOCK'},
            {value: 'PRIMARY', label: 'PRIMARY'}
        ];

        $scope.memoryModes = [
            {value: 'ONHEAP_TIERED', label: 'ONHEAP_TIERED'},
            {value: 'OFFHEAP_TIERED', label: 'OFFHEAP_TIERED'},
            {value: 'OFFHEAP_VALUES', label: 'OFFHEAP_VALUES'}
        ];

        $scope.evictionPolicies = [
            {value: 'LRU', label: 'Least Recently Used'},
            {value: 'RND', label: 'Random'},
            {value: 'FIFO', label: 'FIFO'},
            {value: 'SORTED', label: 'Sorted'},
            {value: undefined, label: 'Not set'}
        ];

        $scope.rebalanceModes = [
            {value: 'SYNC', label: 'SYNC'},
            {value: 'ASYNC', label: 'ASYNC'},
            {value: 'NONE', label: 'NONE'}
        ];

        $scope.cacheStoreFactories = [
            {value: 'CacheJdbcPojoStoreFactory', label: 'JDBC POJO store factory'},
            {value: 'CacheJdbcBlobStoreFactory', label: 'JDBC BLOB store factory'},
            {value: 'CacheHibernateBlobStoreFactory', label: 'Hibernate BLOB store factory'}
        ];

        $scope.cacheStoreJdbcDialects = [
            {value: 'BasicJdbcDialect', label: 'Generic JDBC dialect'},
            {value: 'OracleDialect', label: 'Oracle'},
            {value: 'DB2Dialect', label: 'IBM DB2'},
            {value: 'SQLServerDialect', label: 'Microsoft SQL Server'},
            {value: 'MySQLDialect', label: 'My SQL'},
            {value: 'H2Dialect', label: 'H2 database'}
        ];

        $scope.general = [];
        $scope.advanced = [];

        $http.get('/form-models/caches.json')
            .success(function (data) {
                $scope.general = data.general;
                $scope.advanced = data.advanced;
            });

        $scope.caches = [];

        // When landing on the page, get caches and show them.
        $http.get('/rest/caches')
            .success(function (data) {
                $scope.spaces = data.spaces;
                $scope.caches = data.caches;

                $scope.backupItem = angular.fromJson(sessionStorage.cacheBackupItem);

                $scope.$watch('backupItem', function (val) {
                    sessionStorage.cacheBackupItem = angular.toJson(val);
                }, true);
            });

        $scope.selectItem = function (item) {
            $scope.selectedItem = item;

            $scope.backupItem = angular.copy(item);
        };

        // Add new cache.
        $scope.createItem = function () {
            $scope.backupItem = {mode: 'PARTITIONED', atomicityMode: 'ATOMIC'};
            $scope.backupItem.space = $scope.spaces[0]._id;
        };

        // Save cache in db.
        $scope.saveItem = function () {
            var item = $scope.backupItem;

            $http.post('/rest/caches/save', item)
                .success(function (_id) {
                    var i = _.findIndex($scope.caches, function (cache) {
                        return cache._id == _id;
                    });

                    if (i >= 0)
                        angular.extend($scope.caches[i], item);
                    else {
                        item._id = _id;

                        $scope.caches.push(item);
                    }

                    $scope.selectItem(item);
                })
                .error(function (errorMessage) {
                    $alert({title: errorMessage});
                });
        };

        $scope.removeItem = function () {
            var _id = $scope.selectedItem._id;

            $http.post('/rest/caches/remove', {_id: _id})
                .success(function () {
                    var i = _.findIndex($scope.caches, function (cache) {
                        return cache._id == _id;
                    });

                    if (i >= 0) {
                        $scope.caches.splice(i, 1);

                        $scope.selectedItem = undefined;
                        $scope.backupItem = undefined;
                    }
                })
                .error(function (errorMessage) {
                    $alert({title: errorMessage});
                });
        };

        $scope.addIndexedTypes = function (keyCls, valCls) {
            var idxTypes = $scope.backupItem.indexedTypes;

            var newItem = {keyClass: keyCls, valueClass: valCls};

            if (undefined == idxTypes)
                $scope.backupItem.indexedTypes = [newItem];
            else
                idxTypes.push(newItem)
        };

        $scope.editIndexedTypes = function (idx) {
            $scope.indexedTypeIdx = idx;

            if (idx < 0) {
                $scope.currKeyCls = '';
                $scope.currValCls = '';
            }
            else {
                var idxType = $scope.backupItem.indexedTypes[idx];

                $scope.currKeyCls = idxType.keyClass;
                $scope.currValCls = idxType.valueClass;
            }
        };

        $scope.saveIndexedType = function (k, v) {
            var idxTypes = $scope.backupItem.indexedTypes;

            var idx = $scope.indexedTypeIdx;

            if (idx < 0) {
                var newItem = {keyClass: k, valueClass: v};

                if (undefined == idxTypes)
                    $scope.backupItem.indexedTypes = [newItem];
                else
                    idxTypes.push(newItem);
            }
            else {
                var idxType = idxTypes[idx];

                idxType.keyClass = k;
                idxType.valueClass = v;
            }
        };
    }]
);