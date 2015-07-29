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
 * @param prefix To append to java name.
 * @param name to convert.
 * @returns {string} Valid java name.
 */
function toJavaName(prefix, name) {
    var javaName = name.replace(/[^A-Za-z_0-9]+/, '_');

    return prefix + javaName.charAt(0).toLocaleUpperCase() + javaName.slice(1);
}

/**
 * Function to generate java code for cluster configuration.
 *
 * @param cluster Cluster to process.
 * @param javaClass If 'true' then generate factory class otherwise generate code snippet.
 * @param clientMode If 'true' then generate configuration for client node.
 */
exports.generateClusterConfiguration = function (cluster, javaClass, clientMode) {
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

    declareVariable(res, true, 'org.apache.ignite.configuration.IgniteConfiguration', 'cfg');
    res.line();

    if (clientMode) {
        res.line('cfg.setClientMode(true);');
        res.line();
    }

    if (cluster.discovery) {
        var d = cluster.discovery;

        declareVariable(res, true, 'org.apache.ignite.spi.discovery.tcp.TcpDiscoverySpi', 'discovery');

        switch (d.kind) {
            case 'Multicast':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.multicast.TcpDiscoveryMulticastIpFinder');

                addBeanWithProperties(res, 'discovery', d.Multicast, 'ipFinder', 'ipFinder',
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

                addBeanWithProperties(res, 'discovery', d.Vm, 'ipFinder', 'ipFinder', 'TcpDiscoveryVmIpFinder', {
                    addresses: {type: 'list'}
                }, true);

                break;

            case 'S3':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.s3.TcpDiscoveryS3IpFinder');

                if (d.S3)
                    addBeanWithProperties(res, 'discovery', d.S3, 'ipFinder', 'ipFinder', 'TcpDiscoveryS3IpFinder',
                        {bucketName: null}, true);
                else
                    res.line('discovery.setIpFinder(new TcpDiscoveryS3IpFinder());');

                break;

            case 'Cloud':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.cloud.TcpDiscoveryCloudIpFinder');

                addBeanWithProperties(res, 'discovery', d.Cloud, 'ipFinder', 'ipFinder', 'TcpDiscoveryCloudIpFinder', {
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

                addBeanWithProperties(res, 'discovery', d.GoogleStorage, 'ipFinder', 'ipFinder',
                    'TcpDiscoveryGoogleStorageIpFinder', {
                        projectName: null,
                        bucketName: null,
                        serviceAccountP12FilePath: null
                    }, true);

                //if (d.GoogleStorage.addrReqAttempts) todo ????
                //    res.line('<property name="serviceAccountP12FilePath" value="' + escapeAttr(d.GoogleStorage.addrReqAttempts) + '"/>');

                break;

            case 'Jdbc':
                res.line();

                declareVariable(res, true, 'org.apache.ignite.spi.discovery.tcp.ipfinder.jdbc.TcpDiscoveryJdbcIpFinder', 'ipFinder');

                res.line('ipFinder.setInitSchema(' + (d.Jdbc.initSchema != null || d.Jdbc.initSchema) + ');');
                res.line('discovery.setIpFinder(ipFinder);');
                res.needEmptyLine = true;

                break;

            case 'SharedFs':
                res.importClass('org.apache.ignite.spi.discovery.tcp.ipfinder.sharedfs.TcpDiscoverySharedFsIpFinder');

                addBeanWithProperties(res, 'discovery', d.SharedFs, 'ipFinder', 'ipFinder',
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

            var cacheName = toJavaName('cache', cache.name);

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

    addBeanWithProperties(res, 'cfg', cluster.atomicConfiguration, 'atomicConfiguration', 'atomicCfg',
        generatorUtils.atomicConfiguration.className, generatorUtils.atomicConfiguration.fields);

    res.needEmptyLine = true;

    addProperty(res, 'cfg', cluster, 'networkTimeout');
    addProperty(res, 'cfg', cluster, 'networkSendRetryDelay');
    addProperty(res, 'cfg', cluster, 'networkSendRetryCount');
    addProperty(res, 'cfg', cluster, 'segmentCheckFrequency');
    addProperty(res, 'cfg', cluster, 'waitForSegmentOnStart');
    addProperty(res, 'cfg', cluster, 'discoveryStartupDelay');

    res.needEmptyLine = true;

    addProperty(res, 'cfg', cluster, 'deploymentMode', 'DeploymentMode');

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

        addBeanWithProperties(res, 'cfg', marshaller[marshaller.kind], 'marshaller', 'marshaller',
            marshallerDesc.className, marshallerDesc.fields, true);

        addBeanWithProperties(res, 'marshaller', marshaller[marshaller.kind], marshallerDesc.className, marshallerDesc.fields, true);
    }

    addProperty(res, 'cfg', cluster, 'marshalLocalJobs');
    addProperty(res, 'cfg', cluster, 'marshallerCacheKeepAliveTime');
    addProperty(res, 'cfg', cluster, 'marshallerCacheThreadPoolSize');

    res.needEmptyLine = true;

    addProperty(res, 'cfg', cluster, 'metricsExpireTime');
    addProperty(res, 'cfg', cluster, 'metricsHistorySize');
    addProperty(res, 'cfg', cluster, 'metricsLogFrequency');
    addProperty(res, 'cfg', cluster, 'metricsUpdateFrequency');
    res.needEmptyLine = true;

    addProperty(res, 'cfg', cluster, 'peerClassLoadingEnabled');
    addMultiparamProperty(res, 'cfg', cluster, 'peerClassLoadingLocalClassPathExclude');
    addProperty(res, 'cfg', cluster, 'peerClassLoadingMissedResourcesCacheSize');
    addProperty(res, 'cfg', cluster, 'peerClassLoadingThreadPoolSize');
    res.needEmptyLine = true;

    if (cluster.swapSpaceSpi && cluster.swapSpaceSpi.kind == 'FileSwapSpaceSpi') {
        addBeanWithProperties(res, 'cfg', cluster.swapSpaceSpi.FileSwapSpaceSpi, 'swapSpaceSpi', 'swapSpi',
            generatorUtils.swapSpaceSpi.className, generatorUtils.swapSpaceSpi.fields, true);

        res.needEmptyLine = true;
    }

    addProperty(res, 'cfg', cluster, 'clockSyncSamples');
    addProperty(res, 'cfg', cluster, 'clockSyncFrequency');
    addProperty(res, 'cfg', cluster, 'timeServerPortBase');
    addProperty(res, 'cfg', cluster, 'timeServerPortRange');

    res.needEmptyLine = true;

    addProperty(res, 'cfg', cluster, 'publicThreadPoolSize');
    addProperty(res, 'cfg', cluster, 'systemThreadPoolSize');
    addProperty(res, 'cfg', cluster, 'managementThreadPoolSize');
    addProperty(res, 'cfg', cluster, 'igfsThreadPoolSize');

    res.needEmptyLine = true;

    addBeanWithProperties(res, 'cfg', cluster.transactionConfiguration, 'transactionConfiguration',
        'transactionConfiguration', generatorUtils.transactionConfiguration.className,
        generatorUtils.transactionConfiguration.fields);

    res.needEmptyLine = true;

    addProperty(res, 'cfg', cluster, 'cacheSanityCheckEnabled');

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

function createEvictionPolicy(res, varName, evictionPolicy, propertyName) {
    if (evictionPolicy && evictionPolicy.kind) {
        var e = generatorUtils.evictionPolicies[evictionPolicy.kind];

        var obj = evictionPolicy[evictionPolicy.kind.toUpperCase()];

        addBeanWithProperties(res, varName, obj, propertyName, propertyName, e.className, e.fields, true);
    }
}

function addCacheTypeMetadataDatabaseFields(res, varName, meta, fieldProperty) {
    var fields = meta[fieldProperty];

    if (fields && fields.length > 0) {
        res.emptyLineIfNeeded();

        var varDbFields = fieldProperty;

        var varNew = !res[fieldProperty];

        if (varNew)
            res[fieldProperty] = true;

        declareVariable(res, varNew, 'java.util.Collection', varDbFields, 'java.util.ArrayList', 'org.apache.ignite.cache.CacheTypeFieldMetadata');

        res.importClass('org.apache.ignite.cache.CacheTypeFieldMetadata');

        _.forEach(fields, function (field) {
            res.line(varDbFields + '.add(new CacheTypeFieldMetadata(' +
                '"' + field.databaseName + '", ' +
                'java.sql.Types.' + field.databaseType + ', ' +
                '"' + field.javaName + '", ' +
                field.javaType + '.class'
                + '));');
        });

        res.line(varName + '.' + toJavaName('set', fieldProperty) + '(' + varDbFields + ');');
    }
}

function addCacheTypeMetadataQueryFields(res, varType, meta, fieldProperty) {
    var fields = meta[fieldProperty];

    if (fields && fields.length > 0) {
        res.emptyLineIfNeeded();

        var varQryFields = fieldProperty;

        var varNew = !res[fieldProperty];

        if (varNew)
            res[fieldProperty] = true;

        declareVariable(res, varNew, 'java.util.Map', varQryFields, 'java.util.LinkedHashMap', 'java.lang.String', 'java.lang.Class<?>');

        _.forEach(fields, function (field) {
            var cls = res.importClass(generatorUtils.javaBuildInClass(field.className));

            res.line(varQryFields + '.put("' + field.name + '", ' + cls + '.class);');
        });

        res.line(varType + '.' + toJavaName('set', fieldProperty) + '(' + varQryFields + ');');
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

function generateCacheTypeMetadataConfiguration(res, cache, meta) {
    var varType = 'meta';

    var varNew = !res[varType];

    if (varNew)
        res[varType] = true;

    declareVariable(res, varNew, 'org.apache.ignite.cache.CacheTypeMetadata', varType);

    addProperty(res, varType, meta, 'databaseSchema');
    addProperty(res, varType, meta, 'databaseTable');

    addProperty(res, varType, meta, 'keyType');
    addProperty(res, varType, meta, 'valueType');

    addCacheTypeMetadataDatabaseFields(res, varType, meta, 'keyFields');
    res.needEmptyLine = true;

    addCacheTypeMetadataDatabaseFields(res, varType, meta, 'valueFields');
    res.needEmptyLine = true;

    addCacheTypeMetadataQueryFields(res, varType, meta, 'queryFields');
    res.needEmptyLine = true;

    addCacheTypeMetadataQueryFields(res, varType, meta, 'ascendingFields');
    res.needEmptyLine = true;

    addCacheTypeMetadataQueryFields(res, varType, meta, 'descendingFields');
    res.needEmptyLine = true;

    addListProperty(res, varType, meta, 'textFields');
    res.needEmptyLine = true;

    addCacheTypeMetadataGroups(res, varType, meta);

    res.line();

    return varType;
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
    res.emptyLineIfNeeded();

    res.importClass('org.apache.ignite.cache.CacheAtomicityMode');
    res.importClass('org.apache.ignite.cache.CacheMode');

    declareVariable(res, true, 'org.apache.ignite.configuration.CacheConfiguration', varName);

    res.needEmptyLine = true;

    addProperty(res, varName, cache, 'name');

    addProperty(res, varName, cache, 'mode', 'CacheMode', 'cacheMode');

    addProperty(res, varName, cache, 'atomicityMode', 'CacheAtomicityMode');
    addProperty(res, varName, cache, 'backups');
    addProperty(res, varName, cache, 'startSize');
    addProperty(res, varName, cache, 'readFromBackup');

    res.needEmptyLine = true;

    addProperty(res, varName, cache, 'memoryMode', 'CacheMemoryMode');
    addProperty(res, varName, cache, 'offHeapMaxMemory');
    addProperty(res, varName, cache, 'swapEnabled');
    addProperty(res, varName, cache, 'copyOnRead');

    res.needEmptyLine = true;

    createEvictionPolicy(res, varName, cache.evictionPolicy, 'evictionPolicy');

    if (cache.nearCacheEnabled) {
        res.needEmptyLine = true;

        res.importClass('org.apache.ignite.configuration.NearCacheConfiguration');

        addBeanWithProperties(res, varName, cache.nearConfiguration, 'nearConfiguration', 'nearConfiguration',
            'NearCacheConfiguration', {nearStartSize: null}, true);

        if (cache.nearConfiguration && cache.nearConfiguration.nearEvictionPolicy && cache.nearConfiguration.nearEvictionPolicy.kind) {
            createEvictionPolicy(res, 'nearConfiguration', cache.nearConfiguration.nearEvictionPolicy, 'nearEvictionPolicy');
        }
    }

    res.needEmptyLine = true;

    addProperty(res, varName, cache, 'sqlEscapeAll');
    addProperty(res, varName, cache, 'sqlOnheapRowCacheSize');
    addProperty(res, varName, cache, 'longQueryWarningTimeout');

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

    addMultiparamProperty(res, varName, cache, 'sqlFunctionClasses', 'class');

    res.needEmptyLine = true;

    addProperty(res, varName, cache, 'rebalanceMode', 'CacheRebalanceMode');
    addProperty(res, varName, cache, 'rebalanceThreadPoolSize');
    addProperty(res, varName, cache, 'rebalanceBatchSize');
    addProperty(res, varName, cache, 'rebalanceOrder');
    addProperty(res, varName, cache, 'rebalanceDelay');
    addProperty(res, varName, cache, 'rebalanceTimeout');
    addProperty(res, varName, cache, 'rebalanceThrottle');

    res.needEmptyLine = true;

    if (cache.cacheStoreFactory && cache.cacheStoreFactory.kind) {
        var storeFactory = cache.cacheStoreFactory[cache.cacheStoreFactory.kind];
        var data = generatorUtils.storeFactories[cache.cacheStoreFactory.kind];

        var sfVarName = toJavaName('storeFactory', cache.name);
        var dsVarName = 'none';

        if (storeFactory.dialect) {
            var dataSourceBean = storeFactory.dataSourceBean;

            dsVarName = 'dataSource' + generatorUtils.toJavaName(dataSourceBean);

            if (!_.contains(res.datasourceBeans, dataSourceBean)) {
                res.datasourceBeans.push(dataSourceBean);

                var dataSource = generatorUtils.dataSources[storeFactory.dialect];

                res.line();

                declareVariable(res, true, dataSource.className, dsVarName);

                res.line(dsVarName + '.setURL(_URL_);');
                res.line(dsVarName + '.setUsername(_User_Name_);');
                res.line(dsVarName + '.setPassword(_Password_);');
            }
        }

        addBeanWithProperties(res, varName, storeFactory, 'cacheStoreFactory', sfVarName, data.className,
            data.fields, true);

        if (dsVarName != 'none')
            res.line(sfVarName + '.setDataSource(' + dsVarName + ');');
    }

    res.needEmptyLine = true;

    addProperty(res, varName, cache, 'loadPreviousValue');
    addProperty(res, varName, cache, 'readThrough');
    addProperty(res, varName, cache, 'writeThrough');

    res.needEmptyLine = true;

    addProperty(res, varName, cache, 'invalidate');
    addProperty(res, varName, cache, 'defaultLockTimeout');
    addProperty(res, varName, cache, 'transactionManagerLookupClassName');

    res.needEmptyLine = true;

    addProperty(res, varName, cache, 'writeBehindEnabled');
    addProperty(res, varName, cache, 'writeBehindBatchSize');
    addProperty(res, varName, cache, 'writeBehindFlushSize');
    addProperty(res, varName, cache, 'writeBehindFlushFrequency');
    addProperty(res, varName, cache, 'writeBehindFlushThreadCount');

    res.needEmptyLine = true;

    addProperty(res, varName, cache, 'statisticsEnabled');
    addProperty(res, varName, cache, 'managementEnabled');

    res.needEmptyLine = true;

    addProperty(res, varName, cache, 'maxConcurrentAsyncOperations');

    res.needEmptyLine = true;

    // Generate cache type metadata configs.
    if ((cache.queryMetadata && cache.queryMetadata.length > 0) ||
        (cache.storeMetadata && cache.storeMetadata.length > 0)) {
        res.emptyLineIfNeeded();

        var varTypes = 'types';

        var varNew = !res[varTypes];

        if (varNew)
            res[varTypes] = true;

        declareVariable(res, varNew, 'java.util.Collection', varTypes, 'java.util.ArrayList', 'org.apache.ignite.cache.CacheTypeMetadata');
        res.line();

        var metaNames = [];

        if (cache.queryMetadata && cache.queryMetadata.length > 0) {
            _.forEach(cache.queryMetadata, function (meta) {
                if (!_.contains(metaNames, meta.name)) {
                    metaNames.push(meta.name);

                    res.line(varTypes + '.add(' + generateCacheTypeMetadataConfiguration(res, cache, meta) + ');');
                    res.line();
                }
            });
        }

        if (cache.storeMetadata && cache.storeMetadata.length > 0) {
            _.forEach(cache.storeMetadata, function (meta) {
                if (!_.contains(metaNames, meta.name)) {
                    metaNames.push(meta.name);

                    res.line(varTypes + '.add(' + generateCacheTypeMetadataConfiguration(res, cache, meta) + ');');
                    res.line();
                }
            });
        }

        res.line(varName + '.setCacheTypeMetadata(' + varTypes + ');');
    }
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

/**
 * Add variable declaration.
 *
 * @param res Resulting output with generated code.
 * @param varNew If 'true' then declare new variable otherwise reuse previously declared variable.
 * @param varFullType Variable full class name to be added to imports.
 * @param varName Variable name.
 * @param varFullActualType Variable actual full class name to be added to imports.
 * @param varFullGenericType1 Optional full class name of first generic.
 * @param varFullGenericType2 Optional full class name of second generic.
 */
function declareVariable(res, varNew, varFullType, varName, varFullActualType, varFullGenericType1, varFullGenericType2) {
    var varType = res.importClass(varFullType);

    if (varFullActualType && varFullGenericType1) {
        var varActualType = res.importClass(varFullActualType);
        var varGenericType1 = res.importClass(varFullGenericType1);

        if (varFullGenericType2)
            var varGenericType2 = res.importClass(varFullGenericType2);

        res.line((varNew ? (varType + '<' + varGenericType1 + (varGenericType2 ? ', ' + varGenericType2 : '') + '> ') : '') + varName + ' = new ' + varActualType + '<>();');
    }
    else
        res.line((varNew ? (varType + ' ') : '') + varName + ' = new ' + varType + '();');
}

/**
 * Add property via setter / property name.
 *
 * @param res Resulting output with generated code.
 * @param varName Variable name.
 * @param obj Source object with data.
 * @param propName Property name to take from source object.
 * @param enumType Optional info about property datatype.
 * @param setterName Optional special setter name.
 */
function addProperty(res, varName, obj, propName, enumType, setterName) {
    var val = obj[propName];

    if (generatorUtils.isDefined(val)) {
        res.emptyLineIfNeeded();

        res.line(varName + '.' + getSetterName(setterName ? setterName : propName)
            + '(' + toJavaCode(val, enumType) + ');');
    }
}

/**
 * @param propName Property name
 * @returns Property setter with name by java conventions.
 */
function getSetterName(propName) {
    return toJavaName('set', propName);
}

function addListProperty(res, varName, obj, propName, enumType, setterName) {
    var val = obj[propName];

    if (val && val.length > 0) {
        res.emptyLineIfNeeded();

        res.append(varName + '.' + getSetterName(setterName ? setterName : propName) + '(Arrays.asList(');

        for (var i = 0; i < val.length; i++) {
            if (i > 0)
                res.append(', ');

            res.append(toJavaCode(val[i], enumType));
        }

        res.line('));');
    }
}

function addMultiparamProperty(res, varName, obj, propName, type, setterName) {
    var val = obj[propName];

    if (val && val.length > 0) {
        res.append(varName + '.' + getSetterName(setterName ? setterName : propName) + '(');

        for (var i = 0; i < val.length; i++) {
            if (i > 0)
                res.append(', ');

            res.append(toJavaCode(val[i], type));
        }

        res.line(');');
    }
}

function addBeanWithProperties(res, varName, bean, beanPropName, beanVarName, beanClass, props, createBeanAlthoughNoProps) {
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
                            addListProperty(res, beanVarName, bean, propName, descr.elementsType, descr.setterName);
                            break;

                        case 'enum':
                            addProperty(res, beanVarName, bean, propName, descr.enumClass, descr.setterName);
                            break;

                        case 'float':
                            addProperty(res, beanVarName, bean, propName, 'float', descr.setterName);
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
                            addProperty(res, beanVarName, bean, propName, null, descr.setterName);
                    }
                }
                else {
                    addProperty(res, beanVarName, bean, propName);
                }
            }
        }

        res.line(varName + '.' + getSetterName(beanPropName) + '(' + beanVarName + ');');

        res.needEmptyLine = true;
    }
    else if (createBeanAlthoughNoProps) {
        res.emptyLineIfNeeded();

        res.line(varName + '.' + getSetterName(beanPropName) + '(new ' + beanClass + '());');
    }
}
