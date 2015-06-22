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

configuratorModule.controller('clustersController', ['$scope', '$alert', '$http', 'commonFunctions', function($scope, $alert, $http, commonFunctions) {
        $scope.addSimpleItem = commonFunctions.addSimpleItem;
        $scope.addDetailSimpleItem = commonFunctions.addDetailSimpleItem;
        $scope.swapSimpleItems = commonFunctions.swapSimpleItems;
        $scope.joinTip = commonFunctions.joinTip;

        $scope.templates = [
            {value: {}, label: 'blank'},
            {value: {discovery: {kind: 'Vm', Vm: {addresses: ['127.0.0.1:47500..47510']}}}, label: 'local'},
            {value: {discovery: {kind: 'Multicast', Multicast: {}}}, label: 'multicast'}
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
            {value: 'FileSwapSpaceSpi', label: 'File-based swap'}
        ];

        $scope.events = [
            {value: 'EVTS_CHECKPOINT', label: 'EVTS_CHECKPOINT'},
            {value: 'EVTS_DEPLOYMENT', label: 'EVTS_DEPLOYMENT'},
            {value: 'EVTS_ERROR', label: 'EVTS_ERROR'},
            {value: 'EVTS_DISCOVERY', label: 'EVTS_DISCOVERY'},
            {value: 'EVTS_JOB_EXECUTION', label: 'EVTS_JOB_EXECUTION'},
            {value: 'EVTS_TASK_EXECUTION', label: 'EVTS_TASK_EXECUTION'},
            {value: 'EVTS_CACHE', label: 'EVTS_CACHE'},
            {value: 'EVTS_CACHE_REBALANCE', label: 'EVTS_CACHE_REBALANCE'},
            {value: 'EVTS_CACHE_LIFECYCLE', label: 'EVTS_CACHE_LIFECYCLE'},
            {value: 'EVTS_CACHE_QUERY', label: 'EVTS_CACHE_QUERY'},
            {value: 'EVTS_SWAPSPACE', label: 'EVTS_SWAPSPACE'},
            {value: 'EVTS_IGFS', label: 'EVTS_IGFS'}
        ];

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
            .success(function(data) {
                $scope.templateTip = data.templateTip;

                $scope.general = data.general;
                $scope.advanced = data.advanced;
            });

        // When landing on the page, get clusters and show them.
        $http.get('/rest/clusters')
            .success(function(data) {
                $scope.caches = data.caches;
                $scope.spaces = data.spaces;
                $scope.clusters = data.clusters;
            });

        $scope.selectItem = function(item) {
            $scope.selectedItem = item;

            $scope.backupItem = angular.copy(item);
        };

        // Add new cluster.
        $scope.createItem = function() {
            $scope.backupItem = angular.copy($scope.create.template);

            $scope.backupItem.space = $scope.spaces[0]._id;
        };

        // Save cluster in db.
        $scope.saveItem = function() {
            var item = $scope.backupItem;

            $http.post('/rest/clusters/save', item)
                .success(function(_id) {
                    var i = _.findIndex($scope.clusters, function(cluster) {
                        return cluster._id == _id;
                    });

                    if (i >= 0)
                        angular.extend($scope.clusters[i], item);
                    else {
                        item._id = _id;

                        $scope.clusters.push(item);
                    }

                    $scope.selectItem(item);
                })
                .error(function(errorMessage) {
                    $alert({title: errorMessage});
                });
        };

        $scope.removeItem = function() {
            var _id = $scope.selectedItem._id;

            $http.post('/rest/clusters/remove', {_id: _id})
                .success(function() {
                    var i = _.findIndex($scope.clusters, function(cluster) {
                        return cluster._id == _id;
                    });

                    if (i >= 0) {
                        $scope.clusters.splice(i, 1);

                        $scope.selectedItem = undefined;
                        $scope.backupItem = undefined;
                    }
                })
                .error(function(errorMessage) {
                    $alert({title: errorMessage});
                });
        };
    }]
);