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
    
    res.emptyLineIfNeeded = function() {
        if (this.needEmptyLine) {
            this.line();

            this.needEmptyLine = false;
        }
    };
    
    return res;
}

function addProperty(res, obj, propName, newLine) {
    var val = obj[propName];
    
    if (val) {
        res.emptyLineIfNeeded();
        
        res.line('<property name="' + propName + '" value="' + escapeAttr(val) + '"/>');
    }
}

function addBeanWithProperties(res, obj, beanPropName, beanClass, props) {
    var bean = obj[beanPropName];

    if (bean) {
        var hasProp = false;
        
        for (var i = 0; i < props.length; i++) {
            if (bean[props[i]]) {
                hasProp = true;
                
                break;
            } 
        }
        
        if (hasProp) {
            res.emptyLineIfNeeded();

            res.startBlock('<property name="' + beanPropName + '">');
            res.startBlock('<bean class="' + beanClass + '">');

            for (i = 0; i < props.length; i++) {
                addProperty(res, bean, props[i]);
            }

            res.endBlock('</bean>');
            res.endBlock('</property>');
        }
    }
}

function addListProperty(res, obj, propName) {
    var val = obj[propName];
    
    if (val && val.length > 0) {
        res.emptyLineIfNeeded();
        
        res.startBlock('<property name="' + propName + '">');
        res.startBlock('<list>');
        
        for (var i = 0; i < val.length; i++)
            res.line('<value>' + escape(val[i]) + '</value>');

        res.endBlock('</list>');
        res.endBlock('</property>');
    }
}



function escapeAttr(s) {
    if (typeof(s) != 'string')
        return s;
    
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escape(s) {
    if (typeof(s) != 'string')
        return s;
    
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
                res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.multicast.TcpDiscoveryMulticastIpFinder">');

                addProperty(res, d.Multicast, 'multicastGroup');
                addProperty(res, d.Multicast, 'multicastPort');
                addProperty(res, d.Multicast, 'responseWaitTime');
                addProperty(res, d.Multicast, 'addressRequestAttempts');
                addProperty(res, d.Multicast, 'localAddress');
                
                res.endBlock('</bean>');
                
                break;
            
            case 'Vm':
                if (d.Vm.addresses.length > 0) {
                    res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.multicast.TcpDiscoveryMulticastIpFinder">');

                    addListProperty(res, d.Vm, 'addresses');

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

                addProperty(res, d.Cloud, 'credential');
                addProperty(res, d.Cloud, 'credentialPath');
                addProperty(res, d.Cloud, 'identity');
                addProperty(res, d.Cloud, 'provider');
                
                res.endBlock('</bean>');

                break;
            
            case 'GoogleStorage':
                res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.gce.TcpDiscoveryGoogleStorageIpFinder">');

                addProperty(res, d.GoogleStorage, 'projectName');
                addProperty(res, d.GoogleStorage, 'bucketName');
                addProperty(res, d.GoogleStorage, 'serviceAccountP12FilePath');

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
                    addProperty(res, d.SharedFs, 'path');
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
        
        res.needEmptyLine = true
    }

    addBeanWithProperties(res, cluster, 'atomicConfiguration', 'org.apache.ignite.configuration.AtomicConfiguration',
        ['backups', 'cacheMode', 'atomicSequenceReserveSize']);
    res.needEmptyLine = true;

    addProperty(res, cluster, 'clockSyncSamples');
    addProperty(res, cluster, 'clockSyncFrequency');
    res.needEmptyLine = true;
    addListProperty(res, cluster, 'includeEventTypes');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'igfsThreadPoolSize');
    addProperty(res, cluster, 'publicThreadPoolSize');
    addProperty(res, cluster, 'systemThreadPoolSize');
    addProperty(res, cluster, 'utilityCachePoolSize');
    addProperty(res, cluster, 'managementThreadPoolSize');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'marshalLocalJobs');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'marshCacheKeepAliveTime');
    addProperty(res, cluster, 'marshCachePoolSize');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'cacheSanityCheckEnabled');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'metricsExpireTime');
    addProperty(res, cluster, 'metricsHistorySize');
    addProperty(res, cluster, 'metricsLogFrequency');
    addProperty(res, cluster, 'metricsUpdateFrequency');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'networkTimeout');
    addProperty(res, cluster, 'networkSendRetryDelay');
    addProperty(res, cluster, 'networkSendRetryCount');
    addProperty(res, cluster, 'discoveryStartupDelay');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'deploymentMode');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'peerClassLoadingEnabled');
    addListProperty(res, cluster, 'peerClassLoadingLocalClassPathExclude');
    addProperty(res, cluster, 'peerClassLoadingMissedResourcesCacheSize');
    addProperty(res, cluster, 'peerClassLoadingThreadPoolSize');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'segmentCheckFrequency');
    addProperty(res, cluster, 'segmentationPolicy');
    addProperty(res, cluster, 'allSegmentationResolversPassRequired');
    addProperty(res, cluster, 'segmentationResolveAttempts');
    addProperty(res, cluster, 'waitForSegmentOnStart');
    res.needEmptyLine = true;

    //addBeanWithProperties(res, cluster, 'swapSpaceSpi', 'org.apache.ignite.spi.swapspace.file.FileSwapSpaceSpi',
    //['baseDirectory', 'readStripesNumber', 'maximumSparsity', 'maxWriteQueueSize', 'writeBufferSize']);
    //res.emptyLineIfNeeded();
    
    if (cluster.swapSpaceSpi) {
        res.emptyLineIfNeeded();

        res.startBlock('<property name="swapSpaceSpi">');
        res.startBlock('<bean class="org.apache.ignite.spi.swapspace.file.FileSwapSpaceSpi">');

        addProperty(res, cluster.swapSpaceSpi, 'baseDirectory');
        addProperty(res, cluster.swapSpaceSpi, 'readStripesNumber');
        addProperty(res, cluster.swapSpaceSpi, 'maximumSparsity');
        addProperty(res, cluster.swapSpaceSpi, 'maxWriteQueueSize');
        addProperty(res, cluster.swapSpaceSpi, 'writeBufferSize');

        res.endBlock('</bean>');
        res.endBlock('</property>');

        res.needEmptyLine = true;
    }
    
    addBeanWithProperties(res, cluster, 'transactionConfiguration', 'org.apache.ignite.configuration.TransactionConfiguration',
    ['defaultTxConcurrency', 'transactionIsolation', 'defaultTxTimeout', 'pessimisticTxLogLinger', 
        'pessimisticTxLogSize', 'txSerializableEnabled']);

    addProperty(res, cluster, 'timeServerPortBase');
    addProperty(res, cluster, 'timeServerPortRange');
    res.needEmptyLine = true;
    addProperty(res, cluster, 'utilityCacheKeepAliveTime');
    
    res.push('    </bean>\n');
    res.push('</beans>');

    return res.join('');
}

module.exports = router;