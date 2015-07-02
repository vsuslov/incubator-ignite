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

var dummyNodes = [
    {   id: '234a-443e-0d2a-44912258c290',
        client: false,
        addresses: ['127.0.0.1'],
        hostNames: ['localhost'],
        discoveryPort: 47000,
        caches: [],
        order: 0
    },

    {   id: '382a-4cae-0d2a-44912258c332',
        client: false,
        addresses: ['127.0.0.1'],
        hostNames: ['localhost'],
        caches: ['aaa', 'bbb'],
        discoveryPort: 47001,
        order: 1
    },

    {   id: '162d-4cae-0d2a-1491c253c03a',
        client: false,
        addresses: ['127.0.0.1'],
        hostNames: ['localhost'],
        caches: ['aaa', 'bbb'],
        discoveryPort: 47001,
        order: 2
    },

    {   id: 'c39d-4cae-8dca-7481b213c006',
        client: true,
        addresses: ['127.0.0.1'],
        caches: ['aaa', 'bbb'],
        hostNames: ['localhost'],
        order: 3
    }
];

configuratorModule.controller('clustersListController', ['$scope', '$http', 'commonFunctions', function ($scope, $http, commonFunctions) {
    $scope.nodes = function() {
        var nodes = dummyNodes;

        var res = [];

        for (var i = 0; i < nodes.length; i++) {
            if ($scope.showClients || !nodes[i].client) {
                res.push(nodes[i]);
            }
        }

        return res;
    };

    $scope.showClients = true;

    $scope.hostname = function (node) {
        for (var i = 0; i < node.hostNames.length; i++) {
            if (node.hostNames[i].length > 0)
                return node.hostNames[i];
        }

        for (i = 0; i < node.addresses.length; i++) {
            if (node.addresses[i].length > 0)
                return node.addresses[i];
        }

        return 'unknown';
    };

    $scope.nodeAddr = function (node) {
        var host = $scope.hostname(node);

        if (!node.client && node.discoveryPort) {
            return host + ':' + node.discoveryPort;
        }

        return host;
    }

}]);