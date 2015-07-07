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

configuratorModule.controller('clustersController', ['$scope', '$alert', '$http', 'commonFunctions', function ($scope, $alert, $http, commonFunctions) {
        $scope.swapSimpleItems = commonFunctions.swapSimpleItems;
        $scope.joinTip = commonFunctions.joinTip;
        $scope.getModel = commonFunctions.getModel;
        $scope.errorMessage = commonFunctions.errorMessage;
        $scope.console = console;

        $scope.templates = [
            {value: {discovery: {Vm: {addresses: ['127.0.0.1:47500..47510']}}}, label: 'none'},
            {value: {discovery: {kind: 'Vm', Vm: {addresses: ['127.0.0.1:47500..47510']}}}, label: 'local'},
            {value: {discovery: {kind: 'Multicast', Vm: {addresses: ['127.0.0.1:47500..47510']}, Multicast: {}}}, label: 'multicast'}
        ];

        $scope.discoveries = [
            {value: 'Vm', label: 'static IPs'},
            {value: 'Multicast', label: 'multicast'},
            {value: 'S3', label: 'AWS S3'},
            {value: 'Cloud', label: 'apache jclouds'},
            {value: 'GoogleStorage', label: 'google cloud storage'},
            {value: 'Jdbc', label: 'JDBC'},
            {value: 'SharedFs', label: 'shared filesystem'}
        ];

        $scope.swapSpaceSpis = [
            {value: 'FileSwapSpaceSpi', label: 'File-based swap'},
            {value: undefined, label: 'Not set'}
        ];

        $scope.events = [];

        for (var eventGroupName in eventGroups) {
            if (eventGroups.hasOwnProperty(eventGroupName)) {
                $scope.events.push({value: eventGroupName, label: eventGroupName});
            }
        }

        $scope.cacheModes = [
            {value: 'LOCAL', label: 'LOCAL'},
            {value: 'REPLICATED', label: 'REPLICATED'},
            {value: 'PARTITIONED', label: 'PARTITIONED'}
        ];

        $scope.deploymentModes = [
            {value: 'PRIVATE', label: 'PRIVATE'},
            {value: 'ISOLATED', label: 'ISOLATED'},
            {value: 'SHARED', label: 'SHARED'},
            {value: 'CONTINUOUS', label: 'CONTINUOUS'}
        ];

        $scope.transactionConcurrency = [
            {value: 'OPTIMISTIC', label: 'OPTIMISTIC'},
            {value: 'PESSIMISTIC', label: 'PESSIMISTIC'}
        ];

        $scope.transactionIsolation = [
            {value: 'READ_COMMITTED', label: 'READ_COMMITTED'},
            {value: 'REPEATABLE_READ', label: 'REPEATABLE_READ'},
            {value: 'SERIALIZABLE', label: 'SERIALIZABLE'}
        ];

        $scope.segmentationPolicy = [
            {value: 'RESTART_JVM', label: 'RESTART_JVM'},
            {value: 'STOP', label: 'STOP'},
            {value: 'NOOP', label: 'NOOP'}
        ];

        $scope.marshallers = [
            {value: 'JdkMarshaller', label: 'JdkMarshaller'},
            {value: 'OptimizedMarshaller', label: 'OptimizedMarshaller'}
        ];

        $scope.clusters = [];

        $http.get('/form-models/clusters.json')
            .success(function (data) {
                $scope.templateTip = data.templateTip;

                $scope.general = data.general;
                $scope.advanced = data.advanced;
            })
            .error(function (errMsg) {
                $alert({title: $scope.errorMessage(errMsg)});
            });

        // When landing on the page, get clusters and show them.
        $http.post('/configuration/clusters/list')
            .success(function (data) {
                $scope.caches = data.caches;
                $scope.spaces = data.spaces;
                $scope.clusters = data.clusters;

                var restoredItem = angular.fromJson(sessionStorage.clusterBackupItem);

                if (restoredItem) {
                    var idx = _.findIndex($scope.clusters, function (cluster) {
                        return cluster._id == restoredItem._id;
                    });

                    if (idx >= 0) {
                        $scope.selectedItem = $scope.clusters[idx];

                        $scope.backupItem = restoredItem;
                    }
                    else
                        sessionStorage.removeItem('clusterBackupItem');
                }

                $scope.$watch('backupItem', function (val) {
                    if (val)
                        sessionStorage.clusterBackupItem = angular.toJson(val);
                }, true);
            })
            .error(function (errMsg) {
                $alert({title: $scope.errorMessage(errMsg)});
            });

        $scope.selectItem = function (item) {
            $scope.selectedItem = item;

            $scope.backupItem = angular.copy(item);
        };

        // Add new cluster.
        $scope.createItem = function () {
            $scope.backupItem = angular.copy($scope.create.template);

            $scope.backupItem.space = $scope.spaces[0]._id;
        };

        // Save cluster in db.
        $scope.saveItem = function () {
            var item = $scope.backupItem;

            if (!item.swapSpaceSpi || !item.swapSpaceSpi.kind) {
                for (var cacheId in item.caches) {
                    var idx = _.findIndex($scope.caches, function (cache) {
                        return cache._id == cacheId.value;
                    });

                    if (idx >= 0) {
                        var cache = $scope.caches[idx];

                        if (cache.swapEnabled) {
                            $alert({title: 'Swap space SPI is not configured, but cache "' + cache.label + '" configured to use swap!'});

                            return;
                        }
                    }
                }
            }

            $http.post('/configuration/clusters/save', item)
                .success(function (_id) {
                    var idx = _.findIndex($scope.clusters, function (cluster) {
                        return cluster._id == _id;
                    });

                    if (idx >= 0)
                        angular.extend($scope.clusters[idx], item);
                    else {
                        item._id = _id;

                        $scope.clusters.push(item);
                    }

                    $scope.selectItem(item);

                    $alert({
                        type: 'success',
                        title: 'Cluster "' + item.name + '" saved.',
                        duration: 2,
                        container: '#save-btn'
                    });
                })
                .error(function (errMsg) {
                    $alert({title: $scope.errorMessage(errMsg)});
                });
        };

        $scope.removeItem = function () {
            var _id = $scope.selectedItem._id;

            $http.post('/configuration/clusters/remove', {_id: _id})
                .success(function () {
                    var i = _.findIndex($scope.clusters, function (cluster) {
                        return cluster._id == _id;
                    });

                    if (i >= 0) {
                        $scope.clusters.splice(i, 1);

                        $scope.selectedItem = undefined;
                        $scope.backupItem = undefined;
                    }
                })
                .error(function (errMsg) {
                    $alert({title: $scope.errorMessage(errMsg)});
                });
        };
    }]
);