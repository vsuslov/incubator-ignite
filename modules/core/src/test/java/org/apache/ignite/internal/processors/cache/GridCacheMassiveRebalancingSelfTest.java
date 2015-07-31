/*
 *  Licensed to the Apache Software Foundation (ASF) under one or more
 *  contributor license agreements.  See the NOTICE file distributed with
 *  this work for additional information regarding copyright ownership.
 *  The ASF licenses this file to You under the Apache License, Version 2.0
 *  (the "License"); you may not use this file except in compliance with
 *  the License.  You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package org.apache.ignite.internal.processors.cache;

import org.apache.ignite.*;
import org.apache.ignite.cache.*;
import org.apache.ignite.configuration.*;
import org.apache.ignite.internal.util.typedef.internal.*;
import org.apache.ignite.spi.discovery.tcp.*;
import org.apache.ignite.spi.discovery.tcp.ipfinder.*;
import org.apache.ignite.spi.discovery.tcp.ipfinder.vm.*;
import org.apache.ignite.testframework.junits.common.*;

/**
 *
 */
public class GridCacheMassiveRebalancingSelfTest extends GridCommonAbstractTest {
    /** */
    private static TcpDiscoveryIpFinder ipFinder = new TcpDiscoveryVmIpFinder(true);

    private static int TEST_SIZE = 1_024_000;

    /** cache name. */
    protected static String CACHE_NAME_DHT = "cache";

    @Override protected long getTestTimeout() {
        return Long.MAX_VALUE;
    }

    /** {@inheritDoc} */
    @Override protected IgniteConfiguration getConfiguration(String gridName) throws Exception {
        IgniteConfiguration iCfg = super.getConfiguration(gridName);

        CacheConfiguration<Integer, Integer> cacheCfg = new CacheConfiguration<>();

        ((TcpDiscoverySpi)iCfg.getDiscoverySpi()).setIpFinder(ipFinder);
        ((TcpDiscoverySpi)iCfg.getDiscoverySpi()).setForceServerMode(true);

        cacheCfg.setName(CACHE_NAME_DHT);
        cacheCfg.setCacheMode(CacheMode.PARTITIONED);
        //cacheCfg.setRebalanceBatchSize(1024);
        cacheCfg.setRebalanceMode(CacheRebalanceMode.SYNC);
        //cacheCfg.setRebalanceTimeout(1000000);
        cacheCfg.setBackups(1);

        iCfg.setCacheConfiguration(cacheCfg);
        return iCfg;
    }

    /**
     * @throws Exception
     */
    public void testMassiveRebalancing() throws Exception {
        Ignite ignite = startGrid(0);

        try (IgniteDataStreamer<Integer, Integer> stmr = ignite.dataStreamer(CACHE_NAME_DHT)) {
            for (int i = 0; i < TEST_SIZE; i++) {
                if (i % 1_000_000 == 0)
                    log.info("Prepared " + i / 1_000_000 + "m entries.");

                stmr.addData(i, i);
            }
        }

        log.info("Preloading started.");

        long start = System.currentTimeMillis();

        // startGrid(1);

        startGrid(2);

        long spend = (System.currentTimeMillis() - start) / 1000;

        stopGrid(0);

       // Thread.sleep(10000);

       // stopGrid(1);

        for (int i = 0; i < TEST_SIZE; i++) {
            if (i % 1_000_000 == 0)
                log.info("Checked " + i / 1_000_000 + "m entries.");

            assert grid(2).cachex(CACHE_NAME_DHT).get(i).equals(i) : "keys " + i + " does not match";
        }

        log.info("Spend " + spend + " seconds to preload entries.");

        stopAllGrids();
    }
}