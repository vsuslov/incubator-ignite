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

controlCenterModule.controller('metadataController', ['$scope', '$http', '$common', '$table', function ($scope, $http, $common, $table) {
        $scope.joinTip = $common.joinTip;
        $scope.getModel = $common.getModel;

        $scope.tableNewItem = $table.tableNewItem;
        $scope.tableNewItemActive = $table.tableNewItemActive;
        $scope.tableEditing = $table.tableEditing;
        $scope.tableStartEdit = $table.tableStartEdit;
        $scope.tableRemove = $table.tableRemove;

        $scope.tableSimpleSave = $table.tableSimpleSave;
        $scope.tableSimpleSaveVisible = $table.tableSimpleSaveVisible;
        $scope.tableSimpleUp = $table.tableSimpleUp;
        $scope.tableSimpleDown = $table.tableSimpleDown;
        $scope.tableSimpleDownVisible = $table.tableSimpleDownVisible;

        $scope.tablePairSave = $table.tablePairSave;
        $scope.tablePairSaveVisible = $table.tablePairSaveVisible;

        $scope.templates = [
            {value: {kind: 'query'}, label: 'query'},
            {value: {kind: 'store'}, label: 'store'},
            {value: {kind: 'both'}, label: 'both'}
        ];

        $scope.template = $scope.templates[0].value;

        $scope.kinds = [
            {value: 'query', label: 'query'},
            {value: 'store', label: 'store'},
            {value: 'both', label: 'both'}
        ];

        $scope.databases = [
            {value: 'oracle', label: 'Oracle database'},
            {value: 'db2', label: 'IBM DB2'},
            {value: 'mssql', label: 'MS SQL Server'},
            {value: 'postgre', label: 'PostgreSQL'},
            {value: 'mysql', label: 'MySQL'},
            {value: 'h2', label: 'H2 database'}
        ];

        $scope.data = {
            curTableIdx: 0,
            curFieldIdx: 0,
            curKeyClass: '',
            curValueClass: '',
            curJavaName: '',
            curJavaType: '',
            tables: [
                {schemaName: 'Schema1', use: true},
                {
                    schemaName: 'Schema1',
                    use: true,
                    tableName: 'Table1',
                    keyClass: 'KeyClass1',
                    valueClass: 'ValueClass1',
                    fields: [
                        {
                            use: true,
                            key: true,
                            ak: true,
                            dbName: 'name1',
                            dbType: 'dbType1',
                            javaName: 'javaName1',
                            javaType: 'javaType1'
                        },
                        {
                            use: true,
                            key: false,
                            ak: false,
                            dbName: 'name2',
                            dbType: 'dbType2',
                            javaName: 'javaName2',
                            javaType: 'javaType2'
                        },
                        {
                            use: false,
                            key: false,
                            ak: false,
                            dbName: 'name3',
                            dbType: 'dbType3',
                            javaName: 'javaName3',
                            javaType: 'javaType3'
                        }
                    ]
                },
                {schemaName: 'Schema2 with very long name', use: false},
                {
                    schemaName: 'Schema2',
                    use: false,
                    tableName: 'Table2',
                    keyClass: 'KeyClass2',
                    valueClass: 'ValueClass2',
                    fields: [
                        {
                            use: true,
                            key: true,
                            ak: true,
                            dbName: 'name4',
                            dbType: 'dbType4',
                            javaName: 'javaName4',
                            javaType: 'javaType4'
                        },
                        {
                            use: true,
                            key: false,
                            ak: false,
                            dbName: 'name5',
                            dbType: 'dbType5',
                            javaName: 'javaName5',
                            javaType: 'javaType5'
                        },
                        {
                            use: false,
                            key: false,
                            ak: false,
                            dbName: 'name6',
                            dbType: 'dbType6',
                            javaName: 'javaName6',
                            javaType: 'javaType6'
                        }
                    ]
                },
                {
                    schemaName: 'Schema2',
                    use: false,
                    tableName: 'Table3',
                    keyClass: 'KeyClass3',
                    valueClass: 'ValueClass3',
                    fields: [
                        {
                            use: true,
                            key: true,
                            ak: true,
                            dbName: 'name7',
                            dbType: 'dbType7',
                            javaName: 'javaName7',
                            javaType: 'javaType7'
                        },
                        {
                            use: true,
                            key: false,
                            ak: false,
                            dbName: 'name8',
                            dbType: 'dbType8',
                            javaName: 'javaName8',
                            javaType: 'javaType8'
                        },
                        {
                            use: false,
                            key: false,
                            ak: false,
                            dbName: 'name9',
                            dbType: 'dbType9',
                            javaName: 'javaName9',
                            javaType: 'javaType9'
                        },
                        {
                            use: false,
                            key: false,
                            ak: false,
                            dbName: 'name10',
                            dbType: 'dbType10',
                            javaName: 'javaName10',
                            javaType: 'javaType10'
                        },
                        {
                            use: false,
                            key: false,
                            ak: false,
                            dbName: 'name11',
                            dbType: 'dbType11',
                            javaName: 'javaName11',
                            javaType: 'javaType11'
                        },
                        {
                            use: false,
                            key: false,
                            ak: false,
                            dbName: 'name12',
                            dbType: 'dbType12',
                            javaName: 'javaName12',
                            javaType: 'javaType12'
                        }
                    ]
                }]
        };

        $scope.metadata = [];

        $http.get('/models/metadata.json')
            .success(function (data) {
                $scope.screenTip = data.screenTip;
                $scope.templateTip = data.templateTip;
                $scope.metadataManual = data.metadataManual;
                $scope.metadataDb = data.metadataDb;
            })
            .error(function (errMsg) {
                $common.showError(errMsg);
            });

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
                $common.showError(errMsg);
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
                    $common.showInfo('Metadata "' + item.name + '" saved.');

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

                })
                .error(function (errMsg) {
                    $common.showError(errMsg);
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
                    $common.showError(errMsg);
                });
        };

        $scope.tableSimpleValid = function (item, field, name, index) {
            var model = item[field.model];

            if ($common.isDefined(model)) {
                var idx = _.indexOf(model, name);

                // Found itself.
                if (index > 0 && index == idx)
                    return true;

                // Found duplicate.
                if (idx >= 0) {
                    $common.showError('Field with such name already exists!');

                    return false;
                }
            }

            return true;
        };

        $scope.tablePairValid = function (item, field, name, clsName, index) {
            var model = item[field.model];

            if ($common.isDefined(model)) {
                var idx = _.findIndex(model, function (pair) {return pair.name == name});

                // Found itself.
                if (index > 0 && index == idx)
                    return true;

                // Found duplicate.
                if (idx >= 0) {
                    $common.showError('Field with such name already exists!');

                    return false;
                }
            }

            return true;
        };

        $scope.selectSchema = function (idx) {
            var data = $scope.data;
            var tables = data.tables;
            var schemaName = tables[idx].schemaName;
            var use = tables[idx].use;

            for (var i = idx + 1; i < tables.length; i++) {
                var item = tables[i];

                if (item.schemaName == schemaName && item.tableName)
                    item.use = use;
                else
                    break;
            }

            data.curTableIdx = -1;
            data.curFieldIdx = -1;
        };

        $scope.selectTable = function (idx) {
            var data = $scope.data;

            data.curTableIdx = idx;
            data.curFieldIdx = -1;

            if (idx >= 0) {
                var tbl = data.tables[idx];

                data.curKeyClass = tbl.keyClass;
                data.curValueClass = tbl.valueClass;
            }
        };

        $scope.selectField = function (idx) {
            var data = $scope.data;

            data.curFieldIdx = idx;

            if (idx >= 0) {
                var fld = data.tables[data.curTableIdx].fields[idx];

                data.curJavaName = fld.javaName;
                data.curJavaType = fld.javaType;
            }
        };
    }]
);