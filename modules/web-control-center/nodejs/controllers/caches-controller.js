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

controlCenterModule.controller('cachesController', ['$scope', '$http', '$common', '$confirm', '$saveAs', '$table', function ($scope, $http, $common, $confirm, $saveAs, $table) {
        $scope.joinTip = $common.joinTip;
        $scope.getModel = $common.getModel;

        $scope.tableNewItem = $table.tableNewItem;
        $scope.tableNewItemActive = $table.tableNewItemActive;
        $scope.tableEditing = $table.tableEditing;
        $scope.tableStartEdit = $table.tableStartEdit;
        $scope.tableRemove = $table.tableRemove;

        $scope.tableSimpleSave = $table.tableSimpleSave;
        $scope.tableSimpleSaveVisible = $table.tableSimpleSaveVisible;
        $scope.tableSimpleUp = $table.tableSimpleUp;
        $scope.tableSimpleDown = $table.tableSimpleDown;
        $scope.tableSimpleDownVisible = $table.tableSimpleDownVisible;

        $scope.tablePairSave = $table.tablePairSave;
        $scope.tablePairSaveVisible = $table.tablePairSaveVisible;

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
            {value: 'LRU', label: 'LRU'},
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
            {value: 'CacheHibernateBlobStoreFactory', label: 'Hibernate BLOB store factory'},
            {value: undefined, label: 'Not set'}
        ];

        $scope.cacheStoreJdbcDialects = [
            {value: 'Oracle', label: 'Oracle'},
            {value: 'DB2', label: 'IBM DB2'},
            {value: 'SQLServer', label: 'Microsoft SQL Server'},
            {value: 'MySQL', label: 'My SQL'},
            {value: 'PostgreSQL', label: 'Postgre SQL'},
            {value: 'H2', label: 'H2 database'}
        ];

        $scope.general = [];
        $scope.advanced = [];

        $http.get('/models/caches.json')
            .success(function (data) {
                $scope.screenTip = data.screenTip;
                $scope.general = data.general;
                $scope.advanced = data.advanced;
            })
            .error(function (errMsg) {
                $common.showError(errMsg);
            });

        $scope.caches = [];

        $scope.required = function (field) {
            var model = $common.isDefined(field.path) ? field.path + '.' + field.model : field.model;

            var backupItem = $scope.backupItem;

            var memoryMode = backupItem.memoryMode;

            var onHeapTired = memoryMode == 'ONHEAP_TIERED';
            var offHeapTired = memoryMode == 'OFFHEAP_TIERED';

            var offHeapMaxMemory = backupItem.offHeapMaxMemory;

            if (model == 'offHeapMaxMemory' && offHeapTired)
                return true;

            if (model == 'evictionPolicy.kind' && onHeapTired)
                return backupItem.swapEnabled || ($common.isDefined(offHeapMaxMemory) && offHeapMaxMemory >= 0);

            return false;
        };

        $scope.tableSimpleValid = function (item, field, fx, index) {
            var model = item[field.model];

            if ($common.isDefined(model)) {
                var idx = _.indexOf(model, fx);

                // Found itself.
                if (index >= 0 && index == idx)
                    return true;

                // Found duplicate.
                if (idx >= 0) {
                    $common.showError('SQL function such class name already exists!');

                    return false;
                }
            }

            return true;
        };

        $scope.tablePairValid = function (item, field, keyCls, valCls, index) {
            var model = item[field.model];

            if ($common.isDefined(model)) {
                var idx = _.findIndex(model, function (pair) {return pair.keyClass == keyCls});

                // Found itself.
                if (index >= 0 && index == idx)
                    return true;

                // Found duplicate.
                if (idx >= 0) {
                    $common.showError('Indexed type with such key class already exists!');

                    return false;
                }
            }

            return true;
        };

        // When landing on the page, get caches and show them.
        $http.post('caches/list')
            .success(function (data) {
                $scope.spaces = data.spaces;
                $scope.caches = data.caches;

                var restoredItem = angular.fromJson(sessionStorage.cacheBackupItem);

                if (restoredItem) {
                    if (restoredItem._id) {
                        var idx = _.findIndex($scope.caches, function (cache) {
                            return cache._id == restoredItem._id;
                        });

                        if (idx >= 0) {
                            $scope.selectedItem = $scope.caches[idx];
                            $scope.backupItem = restoredItem;
                        }
                        else
                            sessionStorage.removeItem('cacheBackupItem');
                    }
                    else
                        $scope.backupItem = restoredItem;
                }
                else if ($scope.caches.length > 0)
                    $scope.selectItem($scope.caches[0]);

                $scope.$watch('backupItem', function (val) {
                    if (val)
                        sessionStorage.cacheBackupItem = angular.toJson(val);
                }, true);
            })
            .error(function (errMsg) {
                $common.showError(errMsg);
            });

        $scope.selectItem = function (item) {
            $table.tableReset();

            $scope.selectedItem = item;
            $scope.backupItem = angular.copy(item);
        };

        // Add new cache.
        $scope.createItem = function () {
            $table.tableReset();

            $scope.backupItem = {mode: 'PARTITIONED', atomicityMode: 'ATOMIC', readFromBackup: true, copyOnRead: true};
            $scope.backupItem.space = $scope.spaces[0]._id;
        };

        // Check cache logical consistency.
        function validate(item) {
            var cacheStoreFactorySelected = item.cacheStoreFactory && item.cacheStoreFactory.kind;

            if (cacheStoreFactorySelected && !(item.readThrough || item.writeThrough)) {
                $common.showError('Store is configured but read/write through are not enabled!');

                return false;
            }

            if ((item.readThrough || item.writeThrough) && !cacheStoreFactorySelected) {
                $common.showError('Read / write through are enabled but store is not configured!');

                return false;
            }

            if (item.writeBehindEnabled && !cacheStoreFactorySelected) {
                $common.showError('Write behind enabled but store is not configured!');

                return false;
            }

            return true;
        }

        // Save cache into database.
        function save(item) {
            $http.post('caches/save', item)
                .success(function (_id) {
                    var idx = _.findIndex($scope.caches, function (cache) {
                        return cache._id == _id;
                    });

                    if (idx >= 0)
                        angular.extend($scope.caches[idx], item);
                    else {
                        item._id = _id;

                        $scope.caches.push(item);
                    }

                    $scope.selectItem(item);

                    $common.showInfo('Cache "' + item.name + '" saved.');
                })
                .error(function (errMsg) {
                    $common.showError(errMsg);
                });
        }

        // Save cache.
        $scope.saveItem = function () {
            $table.tableReset();

            var item = $scope.backupItem;

            if (validate(item))
                save(item);
        };

        // Save cache with new name.
        $scope.saveItemAs = function () {
            $table.tableReset();

            if (validate($scope.backupItem))
                $saveAs.show($scope.backupItem.name).then(function (newName) {
                    var item = angular.copy($scope.backupItem);

                    item._id = undefined;
                    item.name = newName;

                    save(item);
                });
        };

        // Remove cache from db.
        $scope.removeItem = function () {
            $table.tableReset();

            var selectedItem = $scope.selectedItem;

            $confirm.show('Are you sure you want to remove cache: "' + selectedItem.name + '"?').then(
                function () {
                    var _id = selectedItem._id;

                    $http.post('caches/remove', {_id: _id})
                        .success(function () {
                            $common.showInfo('Cache has been removed: ' + selectedItem.name);

                            var caches = $scope.caches;

                            var idx = _.findIndex(caches, function (cache) {
                                return cache._id == _id;
                            });

                            if (idx >= 0) {
                                caches.splice(idx, 1);

                                if (caches.length > 0)
                                    $scope.selectItem(caches[0]);
                                else {
                                    $scope.selectedItem = undefined;
                                    $scope.backupItem = undefined;
                                }
                            }
                        })
                        .error(function (errMsg) {
                            $common.showError(errMsg);
                        });
                }
            );
        };
    }]
);