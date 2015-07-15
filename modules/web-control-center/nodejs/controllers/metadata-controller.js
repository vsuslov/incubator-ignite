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

controlCenterModule.controller('metadataController', ['$scope', '$http', 'commonFunctions', function ($scope, $http, commonFunctions) {
        $scope.swapSimpleItems = commonFunctions.swapSimpleItems;
        $scope.joinTip = commonFunctions.joinTip;
        $scope.getModel = commonFunctions.getModel;

        $scope.templates = [
            {value: {kind: 'query'}, label: 'query'},
            {value: {kind: 'store'}, label: 'store'},
            {value: {kind: 'both'}, label: 'both'}
        ];

        $scope.kinds = [
            {value: 'query', label: 'query'},
            {value: 'store', label: 'store'},
            {value: 'both', label: 'both'}
        ];

        $scope.template = $scope.templates[0].value;

        $scope.metadata = [];

        $http.get('/models/metadata.json')
            .success(function (data) {
                $scope.screenTip = data.screenTip;
                $scope.templateTip = data.templateTip;
                $scope.general = data.general;
            })
            .error(function (errMsg) {
                commonFunctions.showError(errMsg);
            });

        $scope.metadatas = [];

        // When landing on the page, get metadatas and show them.
        $http.post('metadata/list')
            .success(function (data) {
                $scope.spaces = data.spaces;
                $scope.metadatas = data.metadatas;

                var restoredItem = angular.fromJson(sessionStorage.metadataBackupItem);

                if (restoredItem && restoredItem._id) {
                    var idx = _.findIndex($scope.metadatas, function (metadata) {
                        return metadata._id == restoredItem._id;
                    });

                    if (idx >= 0) {
                        $scope.selectedItem = $scope.metadatas[idx];

                        $scope.backupItem = restoredItem;
                    }
                    else
                        sessionStorage.removeItem('metadataBackupItem');
                }
                else
                    $scope.backupItem = restoredItem;

                $scope.$watch('backupItem', function (val) {
                    if (val)
                        sessionStorage.metadataBackupItem = angular.toJson(val);
                }, true);
            })
            .error(function (errMsg) {
                commonFunctions.showError(errMsg);
            });

        $scope.selectItem = function (item) {
            $scope.selectedItem = item;

            $scope.backupItem = angular.copy(item);
        };

        // Add new metadata.
        $scope.createItem = function () {
            $scope.backupItem = angular.copy($scope.template);
            $scope.backupItem.space = $scope.spaces[0]._id;
        };

        // Save metadata in db.
        $scope.saveItem = function () {
            var item = $scope.backupItem;

            $http.post('metadata/save', item)
                .success(function (_id) {
                    var idx = _.findIndex($scope.metadatas, function (metadata) {
                        return metadata._id == _id;
                    });

                    if (idx >= 0)
                        angular.extend($scope.metadatas[idx], item);
                    else {
                        item._id = _id;

                        $scope.metadatas.push(item);
                    }

                    $scope.selectItem(item);

                    commonFunctions.showInfo('metadata "' + item.name + '" saved.');
                })
                .error(function (errMsg) {
                    commonFunctions.showError(errMsg);
                });
        };

        $scope.removeItem = function () {
            var _id = $scope.selectedItem._id;

            $http.post('metadata/remove', {_id: _id})
                .success(function () {
                    var i = _.findIndex($scope.metadatas, function (metadata) {
                        return metadata._id == _id;
                    });

                    if (i >= 0) {
                        $scope.metadatas.splice(i, 1);

                        $scope.selectedItem = undefined;
                        $scope.backupItem = undefined;
                    }
                })
                .error(function (errMsg) {
                    commonFunctions.showError(errMsg);
                });
        };
    }]
);