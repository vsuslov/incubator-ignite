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

configuratorModule.controller('clustersList', ['$scope', '$http', function ($scope, $http) {
    $http.get('/rest/clusters').success(function (data) {
        $scope.caches = data.caches;
        $scope.spaces = data.spaces;
        $scope.clusters = data.clusters;
    });

    $scope.cfgLang = 'xml';

    $scope.generateConfig = function(cluster) {
        $scope.loading = true;

        $http.get('/rest/configGenerator', {params: {name: cluster.name, lang: $scope.cfgLang}}).success(
            function (data) {
            $scope.resultCfg = data;

            $scope.loading = false;
        }).error(function (data) {
            $scope.generateError = "Failed to generate config: " + data;

            $scope.loading = false;
        });
    };
    
    $scope.setSelectedCluster = function(cluster) {
        $scope.currCluster = cluster;

        $scope.generateConfig(cluster)
    };
    
    $scope.setCfgLang = function(lang) {
        $scope.cfgLang = lang;

        if ($scope.currCluster)
            $scope.generateConfig($scope.currCluster)
    }
}]);
