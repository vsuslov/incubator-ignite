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
        var lang = $scope.cfgLang;

        if (lang == 'docker')
            lang = 'xml';
        
        $scope.loading = true;

        $http.get('/rest/configGenerator', {params: {name: cluster.name, lang: lang}}).success(
            function (data) {
                if (lang == 'java') {
                    $scope.resultJava = data;
                }
                else if (lang == 'xml') {
                    $scope.resultXml = data;
                }

                $scope.loading = false;
            }).error(function (data) {
                $scope.generateError = "Failed to generate config: " + data;

                $scope.loading = false;
            });
    };

    $scope.dockerArg = {
        os: 'debian:8',
        igniteVersion: '1.1.0'
    };
    
    $scope.dockerFile = function() {
        if (!$scope.currCluster || !$scope.dockerArg) {
            return '';
        }
        
        return 'OS: ' + $scope.dockerArg.os + '\n' +
                'IG ver: ' + $scope.dockerArg.igniteVersion + '\n\n' +
                'cfg: ' + $scope.currCluster._id
    };
    
    $scope.setSelectedCluster = function(cluster) {
        $scope.currCluster = cluster;

        $scope.generateConfig(cluster)
    };
    
    $scope.setCfgLang = function(lang) {
        $scope.resultJava = '';
        $scope.resultXml = '';
        $scope.resultDocker = '';
        
        $scope.cfgLang = lang;

        if ($scope.currCluster)
            $scope.generateConfig($scope.currCluster, lang)
    }
}]);
