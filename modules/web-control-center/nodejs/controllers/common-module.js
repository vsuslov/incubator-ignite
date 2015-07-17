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

var controlCenterModule = angular.module('ignite-web-control-center', ['smart-table', 'mgcrea.ngStrap', 'ui.ace', 'ngSanitize']);

// Common functions to be used in controllers.
controlCenterModule.service('commonFunctions', ['$alert', function ($alert) {
    var msgModal = undefined;

    function errorMessage(errMsg) {
        return errMsg ? errMsg : 'Internal server error.';
    }

    function isDefined(v) {
        return !(v === undefined || v === null);
    }

    return {
        getModel: function (obj, path) {
            if (!isDefined(path))
                return obj;

            path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
            path = path.replace(/^\./, '');           // strip a leading dot

            var segs = path.split('.');
            var root = obj;

            while (segs.length > 0) {
                var pathStep = segs.shift();

                if (typeof root[pathStep] === 'undefined')
                    root[pathStep] = {};

                root = root[pathStep];
            }

            return root;
        },
        swapSimpleItems: function (a, ix1, ix2) {
            var tmp = a[ix1];

            a[ix1] = a[ix2];
            a[ix2] = tmp;
        },
        joinTip: function (arr) {
            if (!arr) {
                return arr;
            }

            var lines = arr.map(function (line) {
                var rtrimmed = line.replace(/\s+$/g, '');

                if (rtrimmed.indexOf('>', this.length - 1) == -1) {
                    rtrimmed = rtrimmed + '<br/>';
                }

                return rtrimmed;
            });

            return lines.join("");
        },
        isDefined: isDefined,
        errorMessage: errorMessage,
        showError: function (msg) {
            if (msgModal)
                msgModal.hide();

            msgModal = $alert({title: errorMessage(msg)});
        },
        showInfo: function (msg) {
            if (msgModal)
                msgModal.hide();

            msgModal = $alert({
                type: 'success',
                title: msg,
                duration: 2
            });
        }
    }
}]);

controlCenterModule.config(function($modalProvider) {
    angular.extend($modalProvider.defaults, {
        html: true
    });
});

controlCenterModule.service('$confirm', function($modal, $rootScope, $q) {
    var scope = $rootScope.$new();

    var deferred;

    scope.ok = function() {
        deferred.resolve();

        confirmModal.hide();
    };

    var confirmModal = $modal({templateUrl: '/confirm', scope: scope, placement: 'center', show: false});

    var parentShow = confirmModal.show;

    confirmModal.show = function(content) {
        scope.content = content || 'Confirm deletion?';

        deferred = $q.defer();

        parentShow();

        return deferred.promise;
    };

    return confirmModal;
});

controlCenterModule.service('$saveAs', function($modal, $rootScope, $q) {
    var scope = $rootScope.$new();

    var deferred;

    scope.ok = function(newName) {
        deferred.resolve(newName);

        saveAsModal.hide();
    };

    var saveAsModal = $modal({templateUrl: '/saveAs', scope: scope, placement: 'center', show: false});

    var parentShow = saveAsModal.show;

    saveAsModal.show = function(oldName) {
        scope.newName = oldName + '(1)';

        deferred = $q.defer();

        parentShow();

        return deferred.promise;
    };

    return saveAsModal;
});

controlCenterModule.config(function ($tooltipProvider) {
    angular.extend($tooltipProvider.defaults, {
        container: 'body',
        placement: 'right',
        html: 'true',
        trigger: 'click hover'
    });
});

controlCenterModule.config(function ($selectProvider) {
    angular.extend($selectProvider.defaults, {
        maxLength: '1',
        allText: 'Select All',
        noneText: 'Clear All',
        templateUrl: '/select',
        iconCheckmark: 'fa fa-check',
        caretHtml: '<span class="caret"></span>'
    });
});

// Alert settings
controlCenterModule.config(function ($alertProvider) {
    angular.extend($alertProvider.defaults, {
        container: 'body',
        placement: 'top-right',
        duration: '5',
        type: 'danger'
    });
});

// Decode name using map(value, label).
controlCenterModule.filter('displayValue', function () {
    return function (v, m, dflt) {
        var i = _.findIndex(m, function (item) {
            return item.value == v;
        });

        if (i >= 0) {
            return m[i].label;
        }

        if (dflt) {
            return dflt;
        }

        return 'Unknown value';
    }
});

/**
 * Replaces all occurrences of {@code org.apache.ignite.} with {@code o.a.i.},
 * {@code org.apache.ignite.internal.} with {@code o.a.i.i.},
 * {@code org.apache.ignite.internal.visor.} with {@code o.a.i.i.v.} and
 * {@code org.apache.ignite.scalar.} with {@code o.a.i.s.}.
 *
 * @param s String to replace in.
 * @return Replaces string.
 */
controlCenterModule.filter('compact', function () {
    return function (s) {
        return s.replace("org.apache.ignite.internal.visor.", "o.a.i.i.v.").
            replace("org.apache.ignite.internal.", "o.a.i.i.").
            replace("org.apache.ignite.scalar.", "o.a.i.s.").
            replace("org.apache.ignite.", "o.a.i.");
    }
});

controlCenterModule.directive('ipaddress', function () {
    const ip = '(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])';
    const port = '([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])';
    const portRange = '(:' + port + '(..' + port + ')?)?';
    const host = '(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])';

    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            ctrl.$validators.ipaddress = function (modelValue, viewValue) {
                if (ctrl.$isEmpty(modelValue) || !attrs['ipaddress'])
                    return true;

                return viewValue.match(new RegExp('(^' + ip + portRange + '$)|(^' + host + portRange + '$)')) != null;
            }
        }
    }
});

controlCenterModule.directive('match', function ($parse) {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            scope.$watch(function () {
                return $parse(attrs.match)(scope) === ctrl.$modelValue;
            }, function (currentValue) {
                ctrl.$setValidity('mismatch', currentValue);
            });
        }
    };
});

controlCenterModule.controller('activeLink', [
    '$scope', function ($scope) {
        $scope.isActive = function (path) {
            return window.location.pathname.substr(0, path.length) == path;
        };
    }]);

controlCenterModule.controller('auth', [
    '$scope', '$modal', '$alert', '$http', '$window', 'commonFunctions',
    function ($scope, $modal, $alert, $http, $window, commonFunctions) {
        $scope.errorMessage = commonFunctions.errorMessage;

        $scope.action = 'login';

        $scope.valid = false;

        $scope.userDropdown = [{"text": "Profile", "href": "/profile"}];

        if (!$scope.becomeUsed) {
            if ($scope.user && $scope.user.admin)
                $scope.userDropdown.push({"text": "Admin Panel", "href": "/admin"});

            $scope.userDropdown.push({"text": "Log Out", "href": "/logout"});
        }

        // Pre-fetch an external template populated with a custom scope
        var authModal = $modal({scope: $scope, templateUrl: '/login', show: false});

        $scope.login = function () {
            // Show when some event occurs (use $promise property to ensure the template has been loaded)
            authModal.$promise.then(authModal.show);
        };

        $scope.auth = function (action, user_info) {
            $http.post('/' + action, user_info)
                .success(function () {
                    authModal.hide();

                    $window.location = '/configuration/clusters';
                })
                .error(function (data) {
                    $alert({placement: 'top', container: '#errors-container', title: $scope.errorMessage(data)});
                });
        };
    }]);