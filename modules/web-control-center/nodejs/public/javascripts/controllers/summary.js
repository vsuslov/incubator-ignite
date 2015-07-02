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

configuratorModule.controller('summaryController', ['$scope', '$http', function ($scope, $http) {
    $http.get('/rest/clusters').success(function (data) {
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

        if (lang == 'docker')
            return;

        var cluster = $scope.selectedItem;
        
        if (!cluster)
            return;
        
        $scope.loading = true;

        $http.get('/rest/configGenerator', {params: 
        {name: cluster.name, lang: lang, generateJavaClass: $scope.generateJavaClass}})
            .success(
            function (data) {
                if (lang == 'java') {
                    $("<pre class='brush:java' />").text(data).appendTo($('#javaResultDiv').empty());
                }
                else if (lang == 'xml') {
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
    
    $scope.downloadDocker = function() {
        var dockerText = $scope.dockerFile();
        
        if (dockerText.length == 0)
            return;
        
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(dockerText));
        pom.setAttribute('download', 'Dockerfile');

        pom.style.display = 'none';
        document.body.appendChild(pom);

        pom.click();

        document.body.removeChild(pom);
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
            "# Intasll Oracle JDK.\n"+
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
}]);
