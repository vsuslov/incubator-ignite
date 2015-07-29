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

var demoResults = [
    {
        id: 256,
        s: 'com.foo.User@3213',
        fields: {
            id: 256,
            firstName: 'Ivan',
            lastName: 'Ivanov',
            old: 23
        }
    },

    {
        id: 384,
        s: 'com.foo.User@23214',
        fields: {
            id: 384,
            firstName: 'Sergey',
            lastName: 'Petrov',
            old: 28
        }
    },

    {
        id: 923,
        s: 'com.foo.User@93494',
        fields: {
            id: 923,
            firstName: 'Andrey',
            lastName: 'Sidorov',
            old: 28
        }
    }
];

var demoCaches = ['Users', 'Organizations', 'Cities'];

controlCenterModule.controller('cacheViewerController', ['$scope', '$http', '$common', function ($scope, $http, $common) {
    $scope.results = demoResults;

    $scope.caches = demoCaches;

    $scope.defCache = $scope.caches.length > 0 ? $scope.caches[0] : null;

    var sqlEditor = ace.edit('querySql');

    sqlEditor.setOptions({
        highlightActiveLine: false,
        showPrintMargin: false,
        showGutter: true,
        theme: "ace/theme/chrome",
        mode: "ace/mode/sql",
        fontSize: 14
    });

    sqlEditor.setValue("select u.id from User u where u.name like 'aaaa';");

    sqlEditor.selection.clearSelection()

}]);
