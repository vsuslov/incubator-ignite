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
    $scope.generateJavaItems = [
        { label: 'snippet',value: false},
        { label: 'factory class',value: true}
    ];

    $scope.generateJavaClass = false;

    $scope.javaData = undefined;
    $scope.xmlData = undefined;
    $scope.dockerData = undefined;

    $http.post('/configuration/clusters/list').success(function (data) {
        $scope.caches = data.caches;
        $scope.spaces = data.spaces;
        $scope.clusters = data.clusters;
    });

    $scope.selectItem = function (item) {
        $scope.selectedItem = item;

        $scope.generateConfig()
    };

    $scope.generateConfig = function() {
        var lang = $scope.cfgLang;

        if (lang == 'docker') {
            $("<pre class='brush:plain' />").text($scope.dockerFile()).appendTo($('#dockerResultDiv').empty());

            return;
        }

        var cluster = $scope.selectedItem;
        
        if (!cluster)
            return;
        
        $scope.loading = true;

        $http.post('/configuration/summary/generator', {_id: cluster._id, lang: lang, generateJavaClass: $scope.generateJavaClass})
            .success(
            function (data) {
                if (lang == 'java') {
                    $scope.javaData = data;

                    $("<pre class='brush:java' />").text(data).appendTo($('#javaResultDiv').empty());
                }
                else if (lang == 'xml') {
                    $scope.xmlData = data;

                    $("<pre class='brush:xml' />").text(data).appendTo($('#xmlResultDiv').empty());
                }

                SyntaxHighlighter.highlight();

                $scope.loading = false;
            }).error(function (data) {
                $scope.generateError = "Failed to generate config: " + data;

                $scope.loading = false;
            });
    };

    $scope.cfgLang = 'xml';

    $scope.$watch('cfgLang', $scope.generateConfig);
    $scope.$watch('generateJavaClass', $scope.generateConfig);

    $scope.dockerArg = {};

    $scope.download = function(text, fileName) {
        if (text.length == 0)
            return;
        
        var file = document.createElement('a');
        file.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(text));
        file.setAttribute('download', fileName);

        file.style.display = 'none';
        document.body.appendChild(file);

        file.click();

        document.body.removeChild(file);
    };

    $scope.downloadJava = function() {
        $scope.download($scope.javaData,
            $scope.generateJavaClass ? 'ConfigurationFactory.java' : $scope.selectedItem.name + '.snipplet.txt');
    };

    $scope.downloadDocker = function() {
        $scope.download($scope.dockerFile(), 'Dockerfile');
    };

    $scope.oss = ['debian:8', 'ubuntu:14.10'];
    
    $scope.dockerFile = function() {
        if (!$scope.selectedItem || !$scope.dockerArg) {
            return '';
        }
        
        var os = $scope.dockerArg.os;
        if (!os) {
            os = 'debian:8'
        }

        return "" +
            "# Start from a Debian image.\n"+
            "FROM " + os + "\n"+
            "\n"+
            "# Install tools.\n"+
            "RUN apt-get update && apt-get install -y --fix-missing \\\n"+
            "  wget \\\n"+
            "  dstat \\\n"+
            "  maven \\\n"+
            "  git\n"+
            "\n"+
            "# Install Oracle JDK.\n"+
            "RUN mkdir /opt/jdk\n"+
            "\n"+
            "RUN wget --header \"Cookie: oraclelicense=accept-securebackup-cookie\" \\\n"+
            "  http://download.oracle.com/otn-pub/java/jdk/7u79-b15/jdk-7u79-linux-x64.tar.gz\n"+
            "\n"+
            "RUN tar -zxf jdk-7u79-linux-x64.tar.gz -C /opt/jdk\n"+
            "\n"+
            "RUN rm jdk-7u79-linux-x64.tar.gz\n"+
            "\n"+
            "RUN update-alternatives --install /usr/bin/java java /opt/jdk/jdk1.7.0_79/bin/java 100\n"+
            "\n"+
            "RUN update-alternatives --install /usr/bin/javac javac /opt/jdk/jdk1.7.0_79/bin/javac 100\n"+
            "\n"+
            "# Sets java variables.\n"+
            "ENV JAVA_HOME /opt/jdk/jdk1.7.0_79/\n"+
            "\n"+
            "# Create working directory\n"+
            "WORKDIR /home\n"+
            "\n"+
            "RUN wget -O ignite.zip http://tiny.cc/updater/download_ignite.php && unzip ignite.zip && rm ignite.zip\n"+
            "\n"+
            "COPY *.xml /tmp/\n"+
            "\n"+
            "RUN mv /tmp/*.xml /home/$(ls)/config";
    };

    $scope.$watch('dockerArg.os', function() {
        $("<pre class='brush:plain' />").text($scope.dockerFile()).appendTo($('#dockerResultDiv').empty());
    });
}]);
