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

var db = require('../db');

var router = require('express').Router();

router.get('/', function(req, res) {
    var lang = req.query.lang;
    var name = req.query.name;

    var user_id = req.user._id;
    
    db.Space.find({$or: [{owner: user_id}, {usedBy: {$elemMatch: {account: user_id}}}]}, function (err, spaces) {
        if (err)
            return res.status(500).send(err.message);

        var space_ids = spaces.map(function(value) {
            return value._id;
        });

        // Get all clusters for spaces.
        db.Cluster.find({name: name, space: {$in: space_ids}}, function (err, clusters) {
            if (err)
                return res.status(500).send(err.message);

            if (clusters.length == 0) {
                res.sendStatus(404);

                return
            }

            var cluster = clusters[0];

            try {
                switch (lang) {
                    case 'xml':
                        res.send(generateXml(cluster));
                        break;

                    case 'java':
                        res.send(generateJava(cluster));
                        break;

                    default:
                        res.status(404).send("Unknown language: " + lang);
                        break;
                }
            }
            catch (e) {
                res.status(500).send(e);
            }
        });
    });
});

function generateJava(cluster) {
    return "java";
}

function multicast(res, multicast) {
    
}

function builder() {
    var res = [];

    res.deep = 0;
    res.lineStart = true;

    res.append = function(s) {
        if (this.lineStart) {
            for (var i = 0; i < this.deep; i++)
                this.push('    ');

            this.lineStart = false;
        }
        
        this.push(s);

        return this;
    };

    res.line = function(s) {
        if (s)
            this.append(s);
        
        this.push('\n');
        this.lineStart = true;
        
        return this;
    };

    res.startBlock = function(s) {
        if (s)
            this.append(s);
        
        this.push('\n');
        this.lineStart = true;
        this.deep++;
        
        return this;
    };

    res.endBlock = function(s) {
        this.deep--;
        
        if (s)
            this.append(s);
        
        this.push('\n');
        this.lineStart = true;
        
        return this;
    };
    
    return res;
}

function escapeAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function generateXml(cluster) {
    var res = builder();

    res.push('' +
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<beans xmlns="http://www.springframework.org/schema/beans"\n' +
        '       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
        '       xsi:schemaLocation="http://www.springframework.org/schema/beans\n' +
        '                           http://www.springframework.org/schema/beans/spring-beans.xsd">\n' +
        '    <bean class="org.apache.ignite.configuration.IgniteConfiguration">\n');

    res.deep = 2;
    
    if (cluster.discovery) {
        res.startBlock('<property name="discoverySpi">');
        res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.TcpDiscoverySpi">');
        res.startBlock('<property name="ipFinder">');

        var className;
        
        var d = cluster.discovery;
        
        switch (d.kind) {
            case 'Multicast':
                var m = d.Multicast;
                
                res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.multicast.TcpDiscoveryMulticastIpFinder">');
                
                if (m.multicastGroup)
                    res.line('<property name="multicastGroup" value="' + escapeAttr(m.multicastGroup) + '"/>');
                
                if (m.multicastPort)
                    res.line('<property name="multicastPort" value="' + m.multicastPort + '"/>');
                
                if (m.responseWaitTime)
                    res.line('<property name="responseWaitTime" value="' + m.responseWaitTime + '"/>');
                
                if (m.addressRequestAttempts)
                    res.line('<property name="addressRequestAttempts" value="' + m.addressRequestAttempts + '"/>');
                
                if (m.localAddress)
                    res.line('<property name="localAddress" value="' + escapeAttr(m.localAddress) + '"/>');
                
                res.endBlock('</bean>');
                
                break;
            
            case 'Vm':
                if (d.Vm.addresses.length > 0) {
                    res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.multicast.TcpDiscoveryMulticastIpFinder">');

                    res.line('<property name="addresses">');
                    res.line('    <list>');

                    for (var i = 0; i < d.Vm.addresses.length; i++) {
                        res.line('<value>' + escapeAttr(d.Vm.addresses[i]) + '</value>');
                    }
                    
                    res.line('    </list>');
                    res.line('</property>');

                    res.endBlock('</bean>');
                }
                else {
                    res.line('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.multicast.TcpDiscoveryMulticastIpFinder"/>');
                }
                
                break;
            
            case 'S3':
                res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.s3.TcpDiscoveryS3IpFinder">');
                
                if (d.S3 && d.S3.bucketName)
                    res.line('<property name="bucketName" value="' + escapeAttr(d.S3.bucketName) + '" />');
                
                res.endBlock('</bean>');
                
                break;
            
            case 'Cloud':
                res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.cloud.TcpDiscoveryCloudIpFinder">');

                if (d.Cloud.credential)
                    res.line('<property name="credential" value="' + escapeAttr(d.Cloud.credential) + '"/>');

                if (d.Cloud.credentialPath)
                    res.line('<property name="credentialPath" value="' + escapeAttr(d.Cloud.credentialPath) + '"/>');

                if (d.Cloud.identity)
                    res.line('<property name="identity" value="' + escapeAttr(d.Cloud.identity) + '"/>');

                if (d.Cloud.provider)
                    res.line('<property name="provider" value="' + escapeAttr(d.Cloud.provider) + '"/>');
                
                res.endBlock('</bean>');

                break;
            
            case 'GoogleStorage':
                res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.gce.TcpDiscoveryGoogleStorageIpFinder">');

                if (d.GoogleStorage.projectName)
                    res.line('<property name="projectName" value="' + escapeAttr(d.GoogleStorage.projectName) + '"/>');

                if (d.GoogleStorage.bucketName)
                    res.line('<property name="bucketName" value="' + escapeAttr(d.GoogleStorage.bucketName) + '"/>');

                if (d.GoogleStorage.serviceAccountP12FilePath)
                    res.line('<property name="serviceAccountP12FilePath" value="' + escapeAttr(d.GoogleStorage.serviceAccountP12FilePath) + '"/>');

                //if (d.GoogleStorage.addrReqAttempts) todo ????
                //    res.line('<property name="serviceAccountP12FilePath" value="' + escapeAttr(d.GoogleStorage.addrReqAttempts) + '"/>');

                res.endBlock('</bean>');

                break;
            
            case 'Jdbc':
                res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.jdbc.TcpDiscoveryJdbcIpFinder">');
                res.line('<property name="initSchema" value="' + (d.Jdbc.initSchema != null || d.Jdbc.initSchema) + '"/>');
                res.endBlock('</bean>');

                break;
            
            case 'SharedFs':
                if (d.SharedFs.initSchema != null) {
                    res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.sharedfs.TcpDiscoverySharedFsIpFinder">');
                    res.line('<property name="path" value="' + escapeAttr(d.SharedFs.path) + '"/>');
                    res.endBlock('</bean>');
                }
                else {
                    res.line('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.sharedfs.TcpDiscoverySharedFsIpFinder"/>');
                }

                break;
            
            default:
                throw "Unknown discovery kind: " + d.kind;
        }

        res.endBlock('</property>');
        res.endBlock('</bean>');
        res.endBlock('</property>');
    }

    res.push('    </bean>\n');
    res.push('</beans>');

    return res.join('');
}

module.exports = router;