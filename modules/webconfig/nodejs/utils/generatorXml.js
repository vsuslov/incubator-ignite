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

var generatorUtils = require("./generatorUtils");
var dataStructures = require("../public/javascripts/dataStructures.js");

exports.generateClusterConfiguration = function(cluster) {
    var res = generatorUtils.builder();

    res.push('' +
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '\n' +
        '<!-- ' + (generatorUtils.mainComment.replace('$date', generatorUtils.formatDate(new Date()))) + ' -->\n' +    
        '<beans xmlns="http://www.springframework.org/schema/beans"\n' +
        '       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:util="http://www.springframework.org/schema/util"\n' +
        '       xsi:schemaLocation="http://www.springframework.org/schema/beans\n' +
        '                           http://www.springframework.org/schema/beans/spring-beans.xsd\n' +
        '                           http://www.springframework.org/schema/util\n' +
        '                           http://www.springframework.org/schema/util/spring-util.xsd">\n' +
        '    <bean class="org.apache.ignite.configuration.IgniteConfiguration">\n');

    res.deep = 2;

    if (cluster.discovery) {
        res.startBlock('<property name="discoverySpi">');
        res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.TcpDiscoverySpi">');
        res.startBlock('<property name="ipFinder">');

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
                    res.startBlock('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.vm.TcpDiscoveryVmIpFinder">');

                    addListProperty(res, d.Vm, 'addresses');

                    res.endBlock('</bean>');
                }
                else {
                    res.line('<bean class="org.apache.ignite.spi.discovery.tcp.ipfinder.vm.TcpDiscoveryVmIpFinder"/>');
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
                if (d.SharedFs.path) {
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

    if (cluster.caches && cluster.caches.length > 0) {
        res.emptyLineIfNeeded();

        res.startBlock('<property name="cacheConfiguration">');
        res.startBlock('<list>');

        for (var i = 0; i < cluster.caches.length; i++) {
            if (i > 0)
                res.line();

            generateCacheConfiguration(cluster.caches[i], res);
        }

        res.endBlock('</list>');
        res.endBlock('</property>');

        res.needEmptyLine = true;
    }

    if (cluster.includeEventTypes && cluster.includeEventTypes.length > 0) {
        res.emptyLineIfNeeded();
        
        res.startBlock('<property name="includeEventTypes">');
        
        if (cluster.includeEventTypes.length == 1) {
            res.line('<util:constant static-field="org.apache.ignite.events.EventType.' + cluster.includeEventTypes[0] + '"/>')
        }
        else {
            res.startBlock('<array>');

            for (i = 0; i < cluster.includeEventTypes.length; i++) {
                if (i > 0)
                    res.line();

                var eventGroup = cluster.includeEventTypes[i];

                res.line('<!-- EventType.' + eventGroup + ' -->');

                var eventList = dataStructures.eventGroups[eventGroup];

                for (var k = 0; k < eventList.length; k++) {
                    res.line('<util:constant static-field="org.apache.ignite.events.EventType.' + eventList[k] + '"/>')
                }
            }

            res.endBlock('</array>');
        }
        
        res.endBlock('</property>');

        res.needEmptyLine = true;
    }
    
    addBeanWithProperties(res, cluster.atomicConfiguration, 'atomicConfiguration',
        generatorUtils.atomicConfiguration.className, generatorUtils.atomicConfiguration.fields);

    res.needEmptyLine = true;

    addProperty(res, cluster, 'networkTimeout');
    addProperty(res, cluster, 'networkSendRetryDelay');
    addProperty(res, cluster, 'networkSendRetryCount');
    addProperty(res, cluster, 'segmentCheckFrequency');
    addProperty(res, cluster, 'waitForSegmentOnStart');
    addProperty(res, cluster, 'discoveryStartupDelay');
    
    res.needEmptyLine = true;
    
    addProperty(res, cluster, 'deploymentMode');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'marshalLocalJobs');
    addProperty(res, cluster, 'marshCacheKeepAliveTime');
    addProperty(res, cluster, 'marshCachePoolSize');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'metricsExpireTime');
    addProperty(res, cluster, 'metricsHistorySize');
    addProperty(res, cluster, 'metricsLogFrequency');
    addProperty(res, cluster, 'metricsUpdateFrequency');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'peerClassLoadingEnabled');
    addListProperty(res, cluster, 'peerClassLoadingLocalClassPathExclude');
    addProperty(res, cluster, 'peerClassLoadingMissedResourcesCacheSize');
    addProperty(res, cluster, 'peerClassLoadingThreadPoolSize');
    
    res.needEmptyLine = true;

    addBeanWithProperties(res, cluster.swapSpaceSpi.FileSwapSpaceSpi, 'swapSpaceSpi',
        generatorUtils.swapSpaceSpi.className, generatorUtils.swapSpaceSpi.fields, true);

    res.needEmptyLine = true;
    
    addProperty(res, cluster, 'clockSyncSamples');
    addProperty(res, cluster, 'clockSyncFrequency');
    addProperty(res, cluster, 'timeServerPortBase');
    addProperty(res, cluster, 'timeServerPortRange');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'publicThreadPoolSize');
    addProperty(res, cluster, 'systemThreadPoolSize');
    addProperty(res, cluster, 'managementThreadPoolSize');
    addProperty(res, cluster, 'igfsThreadPoolSize');

    res.needEmptyLine = true;
    
    addBeanWithProperties(res, cluster.transactionConfiguration, 'transactionConfiguration',
        generatorUtils.transactionConfiguration.className, generatorUtils.transactionConfiguration.fields);

    res.needEmptyLine = true;

    addProperty(res, cluster, 'segmentationPolicy');
    addProperty(res, cluster, 'allSegmentationResolversPassRequired');
    addProperty(res, cluster, 'segmentationResolveAttempts');
    
    res.needEmptyLine = true;

    addProperty(res, cluster, 'cacheSanityCheckEnabled');
    
    res.needEmptyLine = true;

    res.needEmptyLine = true;
    addProperty(res, cluster, 'utilityCacheKeepAliveTime');
    addProperty(res, cluster, 'utilityCachePoolSize');
    
    res.push('    </bean>\n');
    res.push('</beans>');

    return res.join('');
};

function createEvictionPolicy(res, evictionPolicy, propertyName) {
    if (evictionPolicy && evictionPolicy.kind) {
        var e = generatorUtils.evictionPolicies[evictionPolicy.kind];

        var obj = evictionPolicy[evictionPolicy.kind.toUpperCase()];

        addBeanWithProperties(res, obj, propertyName, e.className, e.fields, true);
    }
}

function generateCacheConfiguration(cacheCfg, res) {
    if (!res)
        res = generatorUtils.builder();

    res.startBlock('<bean class="org.apache.ignite.configuration.CacheConfiguration">');

    addProperty(res, cacheCfg, 'mode', 'cacheMode');

    addProperty(res, cacheCfg, 'atomicityMode');
    addProperty(res, cacheCfg, 'backups');

    res.needEmptyLine = true;

    addProperty(res, cacheCfg, 'memoryMode');
    addProperty(res, cacheCfg, 'offHeapMaxMemory');
    addProperty(res, cacheCfg, 'swapEnabled');

    res.needEmptyLine = true;

    createEvictionPolicy(res, cacheCfg.evictionPolicy, 'evictionPolicy');

    res.needEmptyLine = true;

    if (cacheCfg.nearConfiguration) {
        res.emptyLineIfNeeded();

        res.startBlock('<property name="nearConfiguration">');
        res.startBlock('<bean class="org.apache.ignite.configuration.NearCacheConfiguration">');

        addProperty(res, cacheCfg.nearConfiguration, 'nearStartSize');
        addProperty(res, cacheCfg.nearConfiguration, 'atomicSequenceReserveSize');

        createEvictionPolicy(res, cacheCfg.nearConfiguration.nearEvictionPolicy, 'nearEvictionPolicy');

        res.endBlock('</bean>');
        res.endBlock('</property>');
    }

    res.needEmptyLine = true;

    addProperty(res, cacheCfg, 'sqlEscapeAll');
    addProperty(res, cacheCfg, 'sqlOnheapRowCacheSize');
    addProperty(res, cacheCfg, 'longQueryWarningTimeout');

    if (cacheCfg.indexedTypes && cacheCfg.indexedTypes.length > 0) {
        res.startBlock('<property name="indexedTypes">');
        res.startBlock('<array>');

        for (var i = 0; i < cacheCfg.indexedTypes.length; i++) {
            var pair = cacheCfg.indexedTypes[i];

            res.line('<value>' + escape(pair.keyClass) + '</value>');
            res.line('<value>' + escape(pair.valueClass) + '</value>');
        }

        res.endBlock('</array>');
        res.endBlock('</property>');
    }

    addListProperty(res, cacheCfg, 'sqlFunctionClasses', 'array');

    res.needEmptyLine = true;

    addProperty(res, cacheCfg, 'rebalanceMode');
    addProperty(res, cacheCfg, 'rebalanceThreadPoolSize');
    addProperty(res, cacheCfg, 'rebalanceBatchSize');
    addProperty(res, cacheCfg, 'rebalanceOrder');
    addProperty(res, cacheCfg, 'rebalanceDelay');
    addProperty(res, cacheCfg, 'rebalanceTimeout');
    addProperty(res, cacheCfg, 'rebalanceThrottle');

    res.needEmptyLine = true;

    if (cacheCfg.cacheStoreFactory && cacheCfg.cacheStoreFactory.kind) {
        var obj = cacheCfg.cacheStoreFactory[cacheCfg.cacheStoreFactory.kind];
        var data = generatorUtils.storeFactories[cacheCfg.cacheStoreFactory.kind];

        addBeanWithProperties(res, obj, 'cacheStoreFactory', data.className, data.fields, true);
    }

    res.needEmptyLine = true;

    addProperty(res, cacheCfg, 'invalidate');
    addProperty(res, cacheCfg, 'defaultLockTimeout');
    addProperty(res, cacheCfg, 'transactionManagerLookupClassName');

    res.needEmptyLine = true;

    addProperty(res, cacheCfg, 'writeBehindEnabled');
    addProperty(res, cacheCfg, 'writeBehindBatchSize');
    addProperty(res, cacheCfg, 'writeBehindFlushSize');
    addProperty(res, cacheCfg, 'writeBehindFlushFrequency');
    addProperty(res, cacheCfg, 'writeBehindFlushThreadCount');

    res.needEmptyLine = true;

    addProperty(res, cacheCfg, 'statisticsEnabled');
    addProperty(res, cacheCfg, 'managementEnabled');
    addProperty(res, cacheCfg, 'readFromBackup');
    addProperty(res, cacheCfg, 'copyOnRead');
    addProperty(res, cacheCfg, 'maxConcurrentAsyncOperations');
    
    res.endBlock('</bean>');

    return res;
}

exports.generateCacheConfiguration = generateCacheConfiguration;

function addProperty(res, obj, propName, setterName) {
    var val = obj[propName];

    if (val) {
        res.emptyLineIfNeeded();

        res.line('<property name="' + (setterName ? setterName : propName) + '" value="' + escapeAttr(val) + '"/>');
    }
}

function addBeanWithProperties(res, bean, beanPropName, beanClass, props, createBeanAlthoughNoProps) {
    if (!bean)
        return;

    var hasProp = false;
    for (var i = 0; i < props.length; i++) {
        if (bean[props[i]]) {
            hasProp = true;
            break;
        }
    }
    
    if (generatorUtils.hasProperty(bean, props)) {
        res.emptyLineIfNeeded();
        res.startBlock('<property name="' + beanPropName + '">');
        res.startBlock('<bean class="' + beanClass + '">');

        for (var propName in props) {
            if (props.hasOwnProperty(propName)) {
                var descr = props[propName];

                if (descr) {
                    if (descr.type == 'list') {
                        addListProperty(res, bean, propName, descr.setterName);
                    }
                    else if (descr.type == 'className') {
                        if (bean[propName]) {
                            res.startBlock('<property name="' + propName + '">');
                            res.line('<bean class="' + generatorUtils.knownClasses[bean[propName]].className + '"/>');
                            res.endBlock('</property>');
                        }
                    }
                    else {
                        addProperty(res, bean, propName, descr.setterName);
                    }
                }
                else {
                    addProperty(res, bean, propName);
                }
            }
        }

        res.endBlock('</bean>');
        res.endBlock('</property>');
    }
    else if (createBeanAlthoughNoProps) {
        res.emptyLineIfNeeded();
        res.line('<property name="' + beanPropName + '">');
        res.line('    <bean class="' + beanClass + '"/>');
        res.line('</property>');
    }
}
function addListProperty(res, obj, propName, listType, rowFactory) {
    var val = obj[propName];

    if (val && val.length > 0) {
        res.emptyLineIfNeeded();

        if (!listType)
            listType = 'list';

        if (!rowFactory)
            rowFactory = function(val) { return '<value>' + escape(val) + '</value>' };

        res.startBlock('<property name="' + propName + '">');
        res.startBlock('<' + listType + '>');

        for (var i = 0; i < val.length; i++)
            res.line(rowFactory(val[i]));

        res.endBlock('</' + listType + '>');
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
