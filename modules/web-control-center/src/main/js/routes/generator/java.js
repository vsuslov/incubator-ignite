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

var _ = require('lodash');

var generatorUtils = require("./common");

/**
 * Convert some name to valid java name.
 *
 * @param name to convert.
 * @returns {string} Valid java name.
 */
function toJavaName(name) {
    var javaName = name.replace(/[^A-Za-z_0-9]+/, '_');

    return javaName.charAt(0).toLocaleUpperCase() + javaName.slice(1);
}

exports.generateClusterConfiguration = function(cluster, javaClass, clientNearConfiguration) {
    var res = generatorUtils.builder();

    res.datasourceBeans = [];

    if (javaClass) {
        res.line('/**');
        res.line(' * ' + generatorUtils.mainComment());
        res.line(' */');
        res.startBlock('public class ConfigurationFactory {');
        res.line('/**');
        res.line(' * Configure grid.');
        res.line(' */');
        res.startBlock('public IgniteConfiguration createConfiguration() {');
    }
    
    res.importClass('org.apache.ignite.configuration.IgniteConfiguration');
    
    res.line('IgniteConfiguration cfg = new IgniteConfiguration();');
    res.line();

    if (clientNearConfiguration) {
        res.line('cfg.setClientMode(true);');

        res.line();
    }

    if (cluster.discovery) {
        var d = cluster.discovery;

        res.importClass('org.apache.ignite.spi.discovery.tcp.TcpDiscoverySpi');
        res.line('TcpDiscoverySpi discovery = new TcpDiscoverySpi();');

        switch (d.kind) {
            case 'Multicast':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.multicast.TcpDiscoveryMulticastIpFinder');

                addBeanWithProperties(res, d.Multicast, 'discovery', 'ipFinder', 'ipFinder',
                    'TcpDiscoveryMulticastIpFinder', {
                        multicastGroup: null,
                        multicastPort: null,
                        responseWaitTime: null,
                        addressRequestAttempts: null,
                        localAddress: null
                    }, true);

                break;

            case 'Vm':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.vm.TcpDiscoveryVmIpFinder');

                addBeanWithProperties(res, d.Vm, 'discovery', 'ipFinder', 'ipFinder', 'TcpDiscoveryVmIpFinder', {
                        addresses: {type: 'list'}
                    }, true);

                break;

            case 'S3':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.s3.TcpDiscoveryS3IpFinder');

                if (d.S3)
                    addBeanWithProperties(res, d.S3, 'discovery', 'ipFinder', 'ipFinder', 'TcpDiscoveryS3IpFinder',
                        {bucketName: null}, true);
                else
                    res.line('discovery.setIpFinder(new TcpDiscoveryS3IpFinder());');

                break;

            case 'Cloud':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.cloud.TcpDiscoveryCloudIpFinder');

                addBeanWithProperties(res, d.Cloud, 'discovery', 'ipFinder', 'ipFinder', 'TcpDiscoveryCloudIpFinder', {
                        credential: null,
                        credentialPath: null,
                        identity: null,
                        provider: null,
                        regions: {type: 'list'},
                        zones: {type: 'list'}
                    }, true);

                break;

            case 'GoogleStorage':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.gce.TcpDiscoveryGoogleStorageIpFinder');

                addBeanWithProperties(res, d.GoogleStorage, 'discovery', 'ipFinder', 'ipFinder',
                    'TcpDiscoveryGoogleStorageIpFinder', {
                        projectName: null,
                        bucketName: null,
                        serviceAccountP12FilePath: null
                    }, true);

                //if (d.GoogleStorage.addrReqAttempts) todo ????
                //    res.line('<property name="serviceAccountP12FilePath" value="' + escapeAttr(d.GoogleStorage.addrReqAttempts) + '"/>');

                break;

            case 'Jdbc':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.jdbc.TcpDiscoveryJdbcIpFinder');
                
                res.line();
                res.line('TcpDiscoveryJdbcIpFinder ipFinder = new TcpDiscoveryJdbcIpFinder();');
                res.line('ipFinder.setInitSchema(' + (d.Jdbc.initSchema != null || d.Jdbc.initSchema) + ');');
                res.line('discovery.setIpFinder(ipFinder);');
                res.needEmptyLine = true;

                break;

            case 'SharedFs':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.sharedfs.TcpDiscoverySharedFsIpFinder');

                addBeanWithProperties(res, d.SharedFs, 'discovery', 'ipFinder', 'ipFinder',
                    'TcpDiscoverySharedFsIpFinder', {path: null}, true);

                break;

            default:
                throw "Unknown discovery kind: " + d.kind;
        }

        res.emptyLineIfNeeded();

        res.line('cfg.setDiscoverySpi(discovery);');

        res.needEmptyLine = true;
    }

    if (cluster.caches && cluster.caches.length > 0) {
        res.emptyLineIfNeeded();

        var names = [];

        for (var i = 0; i < cluster.caches.length; i++) {
            res.emptyLineIfNeeded();

            var cache = cluster.caches[i];

            var cacheName = 'cache' + toJavaName(cache.name);

            names.push(cacheName);

            generateCacheConfiguration(res, cache, cacheName);

            res.needEmptyLine = true;
        }

        res.emptyLineIfNeeded();

        res.append('cfg.setCacheConfiguration(');

        for (i = 0; i < names.length; i++) {
            if (i > 0)
                res.append(', ');

            res.append(names[i]);
        }

        res.line(');');

        res.needEmptyLine = true;
    }

    addBeanWithProperties(res, cluster.atomicConfiguration, 'cfg', 'atomicConfiguration', 'atomicCfg',
        generatorUtils.atomicConfiguration.className, generatorUtils.atomicConfiguration.fields);

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'networkTimeout');
    addProperty(res, cluster, 'cfg', 'networkSendRetryDelay');
    addProperty(res, cluster, 'cfg', 'networkSendRetryCount');
    addProperty(res, cluster, 'cfg', 'segmentCheckFrequency');
    addProperty(res, cluster, 'cfg', 'waitForSegmentOnStart');
    addProperty(res, cluster, 'cfg', 'discoveryStartupDelay');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'deploymentMode', 'DeploymentMode');

    res.needEmptyLine = true;

    if (cluster.includeEventTypes && cluster.includeEventTypes.length > 0) {
        res.emptyLineIfNeeded();
        
        if (cluster.includeEventTypes.length == 1) {
            res.importClass('org.apache.ignite.events.EventType');
            
            res.line('cfg.setIncludeEventTypes(EventType.' + cluster.includeEventTypes[0] + ');');
        }
        else {
            res.append('int[] events = new int[EventType.' + cluster.includeEventTypes[0] + '.length');
            
            for (i = 1; i < cluster.includeEventTypes.length; i++) {
                res.line();
                
                res.append('    + EventType.' + cluster.includeEventTypes[i] + '.length');
            }
            
            res.line('];');
            res.line();
            res.line('int k = 0;');

            for (i = 0; i < cluster.includeEventTypes.length; i++) {
                res.line();

                var e = cluster.includeEventTypes[i];
                
                res.line('System.arraycopy(EventType.' + e + ', 0, events, k, EventType.' + e + '.length);');
                res.line('k += EventType.' + e + '.length;');
            }
            
            res.line();
            res.line('cfg.setIncludeEventTypes(events);');
        }

        res.needEmptyLine = true;
    }

    res.needEmptyLine = true;

    var marshaller = cluster.marshaller;

    if (marshaller && marshaller.kind) {
        var marshallerDesc = generatorUtils.marshallers[marshaller.kind];

        addBeanWithProperties(res, marshaller[marshaller.kind], 'cfg', 'marshaller', 'marshaller',
            marshallerDesc.className, marshallerDesc.fields, true);

        addBeanWithProperties(res, marshaller[marshaller.kind], 'marshaller', marshallerDesc.className, marshallerDesc.fields, true);
    }

    addProperty(res, cluster, 'cfg', 'marshalLocalJobs');
    addProperty(res, cluster, 'cfg', 'marshallerCacheKeepAliveTime');
    addProperty(res, cluster, 'cfg', 'marshallerCacheThreadPoolSize');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'metricsExpireTime');
    addProperty(res, cluster, 'cfg', 'metricsHistorySize');
    addProperty(res, cluster, 'cfg', 'metricsLogFrequency');
    addProperty(res, cluster, 'cfg', 'metricsUpdateFrequency');
    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'peerClassLoadingEnabled');
    addMultiparamProperty(res, cluster, 'cfg', 'peerClassLoadingLocalClassPathExclude');
    addProperty(res, cluster, 'cfg', 'peerClassLoadingMissedResourcesCacheSize');
    addProperty(res, cluster, 'cfg', 'peerClassLoadingThreadPoolSize');
    res.needEmptyLine = true;

    if (cluster.swapSpaceSpi && cluster.swapSpaceSpi.kind == 'FileSwapSpaceSpi') {
        addBeanWithProperties(res, cluster.swapSpaceSpi.FileSwapSpaceSpi, 'cfg', 'swapSpaceSpi', 'swapSpi',
            generatorUtils.swapSpaceSpi.className, generatorUtils.swapSpaceSpi.fields, true);

        res.needEmptyLine = true;
    }

    addProperty(res, cluster, 'cfg', 'clockSyncSamples');
    addProperty(res, cluster, 'cfg', 'clockSyncFrequency');
    addProperty(res, cluster, 'cfg', 'timeServerPortBase');
    addProperty(res, cluster, 'cfg', 'timeServerPortRange');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'publicThreadPoolSize');
    addProperty(res, cluster, 'cfg', 'systemThreadPoolSize');
    addProperty(res, cluster, 'cfg', 'managementThreadPoolSize');
    addProperty(res, cluster, 'cfg', 'igfsThreadPoolSize');

    res.needEmptyLine = true;

    addBeanWithProperties(res, cluster.transactionConfiguration, 'cfg', 'transactionConfiguration',
        'transactionConfiguration', generatorUtils.transactionConfiguration.className,
        generatorUtils.transactionConfiguration.fields);

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'cacheSanityCheckEnabled');

    res.needEmptyLine = true;

    if (javaClass) {
        res.line();
        res.line('return cfg;');
        res.endBlock('}');
        res.endBlock('}');
        
        return res.generateImports() + '\n\n' + res.join('')
    }
    
    return res.join('');
};

function createEvictionPolicy(res, evictionPolicy, varName, propertyName) {
    if (evictionPolicy && evictionPolicy.kind) {
        var e = generatorUtils.evictionPolicies[evictionPolicy.kind];

        var obj = evictionPolicy[evictionPolicy.kind.toUpperCase()];

        addBeanWithProperties(res, obj, varName, propertyName, propertyName, e.className, e.fields, true);
    }
}

function addCacheTypeMetadataDatabaseFields(res, meta, varName, fieldsProperty) {
    var fields = meta[fieldsProperty];

    if (fields && fields.length > 0) {
        res.line('addCacheTypeMetadataDatabaseFields for ' + varName);
        //res.startBlock('<property name="' + fieldsProperty + '">');
        //
        //res.startBlock('<list>');
        //
        //_.forEach(fields, function (field) {
        //    res.startBlock('<bean class="org.apache.ignite.cache.CacheTypeFieldMetadata">');
        //
        //    addProperty(res, field, 'databaseName');
        //
        //    res.startBlock('<property name="databaseType">');
        //    res.line('<util:constant static-field="java.sql.Types.' + field.databaseType + '"/>');
        //    res.endBlock('</property>');
        //
        //    addProperty(res, field, 'javaName');
        //
        //    addElement(res, 'property', 'name', 'javaType', 'value', generatorUtils.javaBuildInClass(field.javaType));
        //
        //    res.endBlock('</bean>');
        //});
        //
        //res.endBlock('</list>');
        //res.endBlock('</property>');
    }
}

function addCacheTypeMetadataQueryFields(res, meta, varName, fieldsProperty) {
    var fields = meta[fieldsProperty];

    if (fields && fields.length > 0) {
        res.line('addCacheTypeMetadataQueryFields for ' + varName);
        //res.startBlock('<property name="' + fieldsProperty + '">');
        //
        //res.startBlock('<map>');
        //
        //_.forEach(fields, function (field) {
        //    addElement(res, 'entry', 'key', field.name, 'value', generatorUtils.javaBuildInClass(field.className));
        //});
        //
        //res.endBlock('</map>');
        //
        //res.endBlock('</property>');
    }
}

function addCacheTypeMetadataGroups(res, meta, varName) {
    var groups = meta.groups;

    if (groups && groups.length > 0) {
        res.line('addCacheTypeMetadataGroups for ' + varName);
        //res.startBlock('<property name="groups">');
        //res.startBlock('<map>');
        //
        //_.forEach(groups, function (group) {
        //    var fields = group.fields;
        //
        //    if (fields && fields.length > 0) {
        //        res.startBlock('<entry key="' + group.name + '">');
        //        res.startBlock('<map>');
        //
        //        _.forEach(fields, function (field) {
        //            res.startBlock('<entry key="' + field.name + '">');
        //
        //            res.startBlock('<bean class="org.apache.ignite.lang.IgniteBiTuple">');
        //            res.line('<constructor-arg value="' + generatorUtils.javaBuildInClass(field.className) + '"/>');
        //            res.line('<constructor-arg value="' + field.direction + '"/>');
        //            res.endBlock('</bean>');
        //
        //            res.endBlock('</entry>');
        //        });
        //
        //        res.endBlock('</map>');
        //        res.endBlock('</entry>');
        //    }
        //});
        //
        //res.endBlock('</map>');
        //res.endBlock('</property>');
    }
}

function generateCacheTypeMetadataConfiguration(res, meta, varCacheTypeMetadata) {
    if (!res)
        res = generatorUtils.builder();

    res.importClass('org.apache.ignite.cache.CacheTypeMetadata');

    var varType = varCacheTypeMetadata + 'Item';

    addProperty(res, meta, varType, 'databaseSchema');
    addProperty(res, meta, varType, 'databaseTable');

    addProperty(res, meta, varType, 'keyType');
    addProperty(res, meta, varType, 'valueType');

    addCacheTypeMetadataDatabaseFields(res, meta, varType, 'keyFields');
    addCacheTypeMetadataDatabaseFields(res, meta, varType, 'valueFields');

    addCacheTypeMetadataQueryFields(res, meta, varType, 'queryFields');
    addCacheTypeMetadataQueryFields(res, meta, varType, 'ascendingFields');
    addCacheTypeMetadataQueryFields(res, meta, varType, 'descendingFields');

    addListProperty(res, meta, varType, 'textFields');

    addCacheTypeMetadataGroups(res, varType, meta);

    res.line(varCacheTypeMetadata + '.add(' + varType + ')');

    return res;
}

/**
 * Generate java code for cache configuration.
 *
 * @param cache Cache config.
 * @param varName Variable name.
 * @param res Result builder.
 * @returns {*} Append generated java code to builder and return it.
 */
function generateCacheConfiguration(res, cache, varName) {
    if (!res)
        res = generatorUtils.builder();

    res.emptyLineIfNeeded();

    res.importClass('org.apache.ignite.cache.CacheAtomicityMode');
    res.importClass('org.apache.ignite.cache.CacheMode');
    res.importClass('org.apache.ignite.configuration.CacheConfiguration');

    res.line('CacheConfiguration ' + varName + ' = new CacheConfiguration();');

    res.needEmptyLine = true;

    addProperty(res, cache, varName, 'name');
    
    addProperty(res, cache, varName, 'mode', 'CacheMode', 'cacheMode');

    addProperty(res, cache, varName, 'atomicityMode', 'CacheAtomicityMode');
    addProperty(res, cache, varName, 'backups');
    addProperty(res, cache, varName, 'startSize');
    addProperty(res, cache, varName, 'readFromBackup');

    res.needEmptyLine = true;
    
    addProperty(res, cache, varName, 'memoryMode', 'CacheMemoryMode');
    addProperty(res, cache, varName, 'offHeapMaxMemory');
    addProperty(res, cache, varName, 'swapEnabled');
    addProperty(res, cache, varName, 'copyOnRead');

    res.needEmptyLine = true;

    createEvictionPolicy(res, cache.evictionPolicy, varName, 'evictionPolicy');

    if (cache.nearCacheEnabled) {
        res.needEmptyLine = true;

        res.importClass('org.apache.ignite.configuration.NearCacheConfiguration');

        addBeanWithProperties(res, cache.nearConfiguration, varName, 'nearConfiguration', 'nearConfiguration',
            'NearCacheConfiguration', {nearStartSize: null}, true);

        if (cache.nearConfiguration && cache.nearConfiguration.nearEvictionPolicy && cache.nearConfiguration.nearEvictionPolicy.kind) {
            createEvictionPolicy(res, cache.nearConfiguration.nearEvictionPolicy, 'nearConfiguration', 'nearEvictionPolicy');
        }
    }

    res.needEmptyLine = true;
    
    addProperty(res, cache, varName, 'sqlEscapeAll');
    addProperty(res, cache, varName, 'sqlOnheapRowCacheSize');
    addProperty(res, cache, varName, 'longQueryWarningTimeout');
    
    if (cache.indexedTypes && cache.indexedTypes.length > 0) {
        res.emptyLineIfNeeded();
        
        res.append(varName + '.setIndexedTypes(');
        
        for (var i = 0; i < cache.indexedTypes.length; i++) {
            if (i > 0)
                res.append(', ');

            var pair = cache.indexedTypes[i];
            
            res.append(toJavaCode(pair.keyClass, 'class')).append(', ').append(toJavaCode(pair.valueClass, 'class'))
        }
        
        res.line(');');
    }

    addMultiparamProperty(res, cache, varName, 'sqlFunctionClasses', 'class');
    
    res.needEmptyLine = true;

    addProperty(res, cache, varName, 'rebalanceMode', 'CacheRebalanceMode');
    addProperty(res, cache, varName, 'rebalanceThreadPoolSize');
    addProperty(res, cache, varName, 'rebalanceBatchSize');
    addProperty(res, cache, varName, 'rebalanceOrder');
    addProperty(res, cache, varName, 'rebalanceDelay');
    addProperty(res, cache, varName, 'rebalanceTimeout');
    addProperty(res, cache, varName, 'rebalanceThrottle');

    res.needEmptyLine = true;
    
    if (cache.cacheStoreFactory && cache.cacheStoreFactory.kind) {
        var storeFactory = cache.cacheStoreFactory[cache.cacheStoreFactory.kind];
        var data = generatorUtils.storeFactories[cache.cacheStoreFactory.kind];

        var sfVarName = 'storeFactory' + toJavaName(cache.name);
        var dsVarName = 'none';

        if (storeFactory.dialect) {
            var dataSourceBean = storeFactory.dataSourceBean;

            dsVarName = 'dataSource' + generatorUtils.toJavaName(dataSourceBean);

            if (!_.contains(res.datasourceBeans, dataSourceBean)) {
                res.datasourceBeans.push(dataSourceBean);

                var dataSource = generatorUtils.dataSources[storeFactory.dialect];

                res.line();
                res.line(dataSource.className + ' ' + dsVarName + ' = new ' + dataSource.className + '();');
                res.line(dsVarName + '.setURL(_URL_);');
                res.line(dsVarName + '.setUsername(_User_Name_);');
                res.line(dsVarName + '.setPassword(_Password_);');
            }
        }

        addBeanWithProperties(res, storeFactory, varName, 'cacheStoreFactory', sfVarName, data.className,
            data.fields, true);

        if (dsVarName != 'none')
            res.line(sfVarName + '.setDataSource(' + dsVarName + ');');
    }

    res.needEmptyLine = true;

    addProperty(res, cache, varName, 'loadPreviousValue');
    addProperty(res, cache, varName, 'readThrough');
    addProperty(res, cache, varName, 'writeThrough');

    res.needEmptyLine = true;
    
    addProperty(res, cache, varName, 'invalidate');
    addProperty(res, cache, varName, 'defaultLockTimeout');
    addProperty(res, cache, varName, 'transactionManagerLookupClassName');
    
    res.needEmptyLine = true;
    
    addProperty(res, cache, varName, 'writeBehindEnabled');
    addProperty(res, cache, varName, 'writeBehindBatchSize');
    addProperty(res, cache, varName, 'writeBehindFlushSize');
    addProperty(res, cache, varName, 'writeBehindFlushFrequency');
    addProperty(res, cache, varName, 'writeBehindFlushThreadCount');
    
    res.needEmptyLine = true;

    addProperty(res, cache, varName, 'statisticsEnabled');
    addProperty(res, cache, varName, 'managementEnabled');

    res.needEmptyLine = true;

    addProperty(res, cache, varName, 'maxConcurrentAsyncOperations');

    res.needEmptyLine = true;

    // Generate cache type metadata configs.
    if ((cache.queryMetadata && cache.queryMetadata.length > 0) ||
        (cache.storeMetadata && cache.storeMetadata.length > 0)) {
        res.emptyLineIfNeeded();

        var varCacheTypeMetadata = varName + 'TypeMetadata';

        res.line('Collection ' + varCacheTypeMetadata + ' = new ArrayList();');
        res.line();

        var metaNames = [];

        if (cache.queryMetadata && cache.queryMetadata.length > 0) {
            _.forEach(cache.queryMetadata, function (meta) {
                if (!_.contains(metaNames, meta.name)) {
                    metaNames.push(meta.name);

                    generateCacheTypeMetadataConfiguration(res, meta, varCacheTypeMetadata);
                }
            });
        }

        if (cache.storeMetadata && cache.storeMetadata.length > 0) {
            _.forEach(cache.storeMetadata, function (meta) {
                if (!_.contains(metaNames, meta.name)) {
                    metaNames.push(meta.name);

                    generateCacheTypeMetadataConfiguration(meta, res);
                }
            });
        }

        res.line(varName + '.setCacheTypeMetadata(' + varCacheTypeMetadata + ');');
    }
    
    return res;
}

function toJavaCode(val, type) {
    if (val == null)
       return 'null';

    if (type == 'float')
        return val + 'f';
    
    if (type == 'class')
        return val + '.class';
    
    if (type)
        return type + '.' + val;
    
    if (typeof(val) == 'string')
        return '"' + val.replace('"', '\\"') + '"';

    if (typeof(val) == 'number' || typeof(val) == 'boolean')
        return '' + val;

    throw "Unknown type: " + typeof(val) + ' (' + val + ')';
}

function addProperty(res, obj, objVariableName, propName, enumType, setterName) {
    var val = obj[propName];
    
    if (generatorUtils.isDefined(val)) {
        res.emptyLineIfNeeded();

        res.line(objVariableName + '.' + getSetterName(setterName ? setterName : propName)
            + '(' + toJavaCode(val, enumType)  + ');');
    }
}

function getSetterName(propName) {
    return 'set' + propName.charAt(0).toLocaleUpperCase() + propName.slice(1);
}

function addListProperty(res, obj, objVariableName, propName, enumType, setterName) {
    var val = obj[propName];
    
    if (val && val.length > 0) {
        res.append(objVariableName + '.' + getSetterName(setterName ? setterName : propName) + '(Arrays.asList(');

        for (var i = 0; i < val.length; i++) {
            if (i > 0)
                res.append(', ');
            
            res.append(toJavaCode(val[i], enumType));
        }
        
        res.line('));');
    }
}

function addMultiparamProperty(res, obj, objVariableName, propName, type, setterName) {
    var val = obj[propName];
    
    if (val && val.length > 0) {
        res.append(objVariableName + '.' + getSetterName(setterName ? setterName : propName) + '(');

        for (var i = 0; i < val.length; i++) {
            if (i > 0)
                res.append(', ');
            
            res.append(toJavaCode(val[i], type));
        }
        
        res.line(');');
    }
}

function addBeanWithProperties(res, bean, objVarName, beanPropName, beanVarName, beanClass, props, createBeanAlthoughNoProps) {
    if (bean && generatorUtils.hasProperty(bean, props)) {
        if (!res.emptyLineIfNeeded()) {
            res.line();
        }
        
        res.line(beanClass + ' ' + beanVarName + ' = new ' + beanClass + '();');

        for (var propName in props) {
            if (props.hasOwnProperty(propName)) {
                var descr = props[propName];

                if (descr) {
                    switch (descr.type) {
                        case 'list':
                            addListProperty(res, bean, beanVarName, propName, descr.elementsType, descr.setterName);
                            break;
                        
                        case 'enum':
                            addProperty(res, bean, beanVarName, propName, descr.enumClass, descr.setterName);
                            break;
                        
                        case 'float':
                            addProperty(res, bean, beanVarName, propName, 'float', descr.setterName);
                            break;
                        
                        case 'propertiesAsList':
                            var val = bean[propName];
                            
                            if (val && val.length > 0) {
                                res.line('Properties ' + descr.propVarName + ' = new Properties();');
                                
                                for (var i = 0; i < val.length; i++) {
                                    var nameAndValue = val[i];
                                    
                                    var eqIndex = nameAndValue.indexOf('=');
                                    if (eqIndex >= 0) {
                                        res.line(descr.propVarName + '.setProperty(' 
                                            + nameAndValue.substring(0, eqIndex) + ', ' 
                                            + nameAndValue.substr(eqIndex + 1) + ');');
                                    }

                                }
                                
                                res.line(beanVarName + '.' + getSetterName(propName) + '(' + descr.propVarName + ');');
                            }
                            break;
                        
                        case 'className':
                            if (bean[propName]) {
                                res.line(beanVarName + '.' + getSetterName(propName) + '(new ' + generatorUtils.knownClasses[bean[propName]].className + '());');
                            }

                            break;
                        
                        default:
                            addProperty(res, bean, beanVarName, propName, null, descr.setterName);
                    }
                }
                else {
                    addProperty(res, bean, beanVarName, propName);
                }
            }
        }
        
        res.line(objVarName + '.' + getSetterName(beanPropName) + '(' + beanVarName + ');');
        
        res.needEmptyLine = true;
    }
    else if (createBeanAlthoughNoProps) {
        res.emptyLineIfNeeded();
        
        res.line(objVarName + '.' + getSetterName(beanPropName) + '(new ' + beanClass + '());');
    }
}
