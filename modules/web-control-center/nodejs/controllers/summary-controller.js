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

controlCenterModule.controller('summaryController', ['$scope', '$http', function ($scope, $http) {
    $scope.javaClassItems = [
        { label: 'snippet',value: false},
        { label: 'factory class',value: true}
    ];

    $scope.oss = ['debian:8', 'ubuntu:14.10'];

    $scope.cfgLang = 'xml';

    $scope.javaClass = false;
    $scope.os = undefined;

    $scope.generated = undefined;

    $http.post('/configuration/clusters/list').success(function (data) {
        $scope.clusters = data.clusters;
    });

    $scope.reload = function() {
        $("<pre class='brush:java' />").text($scope.javaClass ? $scope.generated.javaClass : $scope.generated.javaSnippet).appendTo($('#javaResultDiv').empty());

        $("<pre class='brush:xml' />").text($scope.generated.xml).appendTo($('#xmlResultDiv').empty());

        var os = $scope.os ? $scope.os : $scope.oss[0];

        $("<pre class='brush:plain' />").text($scope.generated.docker.replace(new RegExp('\%OS\%', 'g'), os)).appendTo($('#dockerResultDiv').empty());

        SyntaxHighlighter.highlight();
    };

    $scope.generate = function(item) {
        if (!item)
            return;

        $scope.selectedItem = item;

        $scope.loading = true;

        $http.post('/configuration/summary/generator', {_id: $scope.selectedItem._id})
            .success(function (data) {
                $scope.generated = data;

                $scope.$watch('javaClass', $scope.reload);
                $scope.$watch('os', $scope.reload);

                $scope.loading = false;
            }).error(function (data) {
                $scope.generateError = "Failed to generate config: " + data;

                $scope.loading = false;
            });
    };

    $scope.download = function() {
        var file = document.createElement('a');

        file.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(text));
        file.setAttribute('download', $scope.selectedItem.name + '-configuration.zip');

        file.style.display = 'none';

        document.body.appendChild(file);

        file.click();

        document.body.removeChild(file);
    };
}]);
