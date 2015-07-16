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

controlCenterModule.controller('summaryController', ['$scope', '$http', 'commonFunctions', function ($scope, $http, commonFunctions) {
    $scope.joinTip = commonFunctions.joinTip;
    $scope.getModel = commonFunctions.getModel;

    $scope.javaClassItems = [
        { label: 'snippet',value: false},
        { label: 'factory class',value: true}
    ];

    $scope.evictionPolicies = [
        {value: 'LRU', label: 'LRU'},
        {value: 'RND', label: 'Random'},
        {value: 'FIFO', label: 'FIFO'},
        {value: 'SORTED', label: 'Sorted'},
        {value: undefined, label: 'Not set'}
    ];

    $scope.backupItem = {nearCacheEnabled: true};

    $http.get('/models/summary.json')
        .success(function (data) {
            $scope.clientFields = data.clientFields;

            $scope.screenTip = data.screenTip;
        })
        .error(function (errMsg) {
            commonFunctions.showError(errMsg);
        });

    $scope.oss = ['debian:8', 'ubuntu:14.10'];

    $scope.cfgLangServer = 'xml';
    $scope.cfgLangClient = 'xml';

    $scope.javaClassServer = false;
    $scope.javaClassClient = false;

    $scope.os = undefined;

    $scope.generated = undefined;
    $scope.clusters = [];

    $scope.reloadServer = function() {
        if (!$scope.generated)
            return;

        $("<pre class='brush:xml'/>").text($scope.generated.xmlServer).appendTo($('#xmlServer').empty());
        $("<pre class='brush:java'/>").text($scope.javaClassServer ? $scope.generated.javaClassServer : $scope.generated.javaSnippetServer).appendTo($('#javaServer').empty());

        var os = $scope.os ? $scope.os : $scope.oss[0];

        $("<pre class='brush:plain'/>").text($scope.generated.docker.replace(new RegExp('\%OS\%', 'g'), os)).appendTo($('#docker').empty());


        $("<pre class='brush:xml'/>").text($scope.generated.xmlClient).appendTo($('#xmlClient').empty());
        $("<pre class='brush:java'/>").text($scope.javaClassClient ? $scope.generated.javaClassClient : $scope.generated.javaSnippetClient).appendTo($('#javaClient').empty());

        SyntaxHighlighter.highlight();
    };

    $scope.reloadServer = function() {
        if (!$scope.generated)
            return;

        $("<pre class='brush:xml'/>").text($scope.generated.xmlServer).appendTo($('#xmlServer').empty());
        $("<pre class='brush:java'/>").text($scope.javaClassServer ? $scope.generated.javaClassServer : $scope.generated.javaSnippetServer).appendTo($('#javaServer').empty());

        var os = $scope.os ? $scope.os : $scope.oss[0];

        $("<pre class='brush:plain'/>").text($scope.generated.docker.replace(new RegExp('\%OS\%', 'g'), os)).appendTo($('#docker').empty());

        SyntaxHighlighter.highlight();
    };

    $scope.selectItem = function(cluster) {
        if (!cluster)
            return;

        $scope.selectedItem = cluster;

        $scope.$watch('javaClassServer', $scope.reloadServer);
        $scope.$watch('os', $scope.reloadServer);

        $scope.generateServer(cluster);

        $scope.reloadServer();

        $scope.$watch('backupItem', function() {
            $scope.generateClient();
        }, true);

        $scope.$watch('javaClassClient', $scope.generateClient);
    };

    $scope.generateServer = function(cluster) {
        $http.post('summary/generator', {_id: cluster._id})
            .success(function (data) {
                $scope.generated = data;

                $scope.reloadServer();
            }).error(function (errMsg) {
                commonFunctions.showError('Failed to generate config: ' + errMsg);
            });
    };

    $scope.generateClient = function() {
        $http.post('summary/generator', {_id: $scope.selectedItem._id, javaClass: $scope.javaClassClient, clientCache: $scope.backupItem})
            .success(function (data) {
                $("<pre class='brush:xml'/>").text(data.xmlClient).appendTo($('#xmlClient').empty());
                $("<pre class='brush:java'/>").text(data.javaClient).appendTo($('#javaClient').empty());

                SyntaxHighlighter.highlight();
            }).error(function (errMsg) {
                commonFunctions.showError('Failed to generate config: ' + errMsg);
            });
    };

    $scope.download = function() {
        $http.post('summary/download', {_id: $scope.selectedItem._id, javaClass: $scope.javaClass, os: $scope.os})
            .success(function (data) {
                var file = document.createElement('a');

                file.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + data);
                file.setAttribute('download', $scope.selectedItem.name + '-configuration.zip');

                file.style.display = 'none';

                document.body.appendChild(file);

                file.click();

                document.body.removeChild(file);
            })
            .error(function (errMsg) {
                commonFunctions.showError('Failed to generate zip: ' + errMsg);
            });
    };

    $http.post('clusters/list').success(function (data) {
        $scope.clusters = data.clusters;

        if ($scope.clusters.length > 0) {
            var restoredId = sessionStorage.summarySelectedId;

            var selectIdx = 0;

            if (restoredId) {
                var idx = _.findIndex($scope.clusters, function (cluster) {
                    return cluster._id == restoredId;
                });

                if (idx >= 0)
                    selectIdx = idx;
                else
                    delete sessionStorage.summarySelectedId;
            }

            $scope.selectItem($scope.clusters[selectIdx]);

            $scope.$watch('selectedItem', function (val) {
                if (val)
                    sessionStorage.summarySelectedId = val._id;
            }, true);
        }
    });
}]);
