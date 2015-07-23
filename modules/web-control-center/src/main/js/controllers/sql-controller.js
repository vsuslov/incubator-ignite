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
        firstName: 'Ivan',
        lastName: 'Ivanov'
    },
    {
        id: 384,
        firstName: 'Sergey',
        lastName: 'Petrov'
    },
    {
        id: 923,
        firstName: 'Andrey',
        lastName: 'Sidorov'
    }
];

var demoCaches = [{_id: '1', name: 'Users', mode: 'LOCAL'}, {_id: '2', name: 'Organizations', mode: 'REPLICATED'}, {_id: '3', name: 'Cities', mode: 'PARTITIONED'}];



controlCenterModule.controller('sqlController', ['$scope', '$http', '$common', function ($scope, $http, $common) {
    $scope.joinTip = $common.joinTip;

    $scope.pageSizes = [50, 100, 200, 400, 800, 1000];

    $scope.tabs = [
        {
            query: "SELECT u.id, u.firstName, u.lastName FROM User u WHERE u.name LIKE 'aaaa'",
            cols: Object.keys(demoResults[0]),
            page: 1,
            hasMore: true,
            total: 0,
            rows: demoResults
        },
        {query: "SELECT * FROM Organization"}
    ];

    $scope.addTab = function() {
        console.log('addTab');

        $scope.tabs.push({query: "SELECT "});
    };

    $scope.removeTab = function(idx) {
        console.log('removeTab');

        $scope.tabs.splice(idx, 1);
    };

    $scope.modes = [
        {value: 'PARTITIONED', label: 'PARTITIONED'},
        {value: 'REPLICATED', label: 'REPLICATED'},
        {value: 'LOCAL', label: 'LOCAL'}
    ];

    $http.get('/models/sql.json')
        .success(function (data) {
            $scope.screenTip = data.screenTip;
        })
        .error(function (errMsg) {
            $common.showError(errMsg);
        });

    $scope.caches = demoCaches;
}]);
