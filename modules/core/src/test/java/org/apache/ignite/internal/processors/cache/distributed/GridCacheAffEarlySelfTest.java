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

package org.apache.ignite.internal.processors.cache.distributed;

import org.apache.ignite.*;
import org.apache.ignite.cache.*;
import org.apache.ignite.configuration.*;
import org.apache.ignite.internal.*;
import org.apache.ignite.marshaller.optimized.*;
import org.apache.ignite.spi.discovery.tcp.*;
import org.apache.ignite.spi.discovery.tcp.ipfinder.*;
import org.apache.ignite.spi.discovery.tcp.ipfinder.vm.*;
import org.apache.ignite.testframework.junits.common.*;

import java.util.*;
import java.util.concurrent.atomic.*;

/**
 *
 */
public class GridCacheAffEarlySelfTest extends GridCommonAbstractTest {
    /** Grid count. */
    private static int GRID_CNT = 8;

    /** Stopped. */
    private volatile boolean stopped;

    /** Iteration. */
    private static final int iters = 10;

    /** Concurrent. */
    private static final boolean concurrent = true;

    /** Futs. */
    private Collection<IgniteInternalFuture<?>> futs = new ArrayList<>(GRID_CNT);

    /** */
    private static TcpDiscoveryIpFinder ipFinder = new TcpDiscoveryVmIpFinder(true);

    /** {@inheritDoc} */
    @Override protected IgniteConfiguration getConfiguration(String gridName) throws Exception {
        IgniteConfiguration cfg = super.getConfiguration(gridName);

        TcpDiscoverySpi discoSpi = new TcpDiscoverySpi();
        discoSpi.setIpFinder(ipFinder);

        cfg.setDiscoverySpi(discoSpi);

        OptimizedMarshaller marsh = new OptimizedMarshaller();
        marsh.setRequireSerializable(false);

        cfg.setMarshaller(marsh);

        return cfg;
    }

    /** {@inheritDoc} */
    @Override protected long getTestTimeout() {
        return 6 * 60 * 1000L;
    }

    /**
     *
     */
    public void testStartNodes() throws Exception {
        for (int i = 0; i < iters; i++) {
            try {
                System.out.println("*** Iteration " + (i + 1) + '/' + iters);

                IgniteInternalFuture<?> fut = multithreadedAsync(new Runnable() {
                    @Override public void run() {
                        try {
                            doTest();
                        }
                        catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }, 1);

                fut.get(30000);
            }
            catch (IgniteFutureTimeoutCheckedException e) {
                // No-op.
            }
            finally {
                stopAllGrids(true);
            }
        }
    }

    /**
     *
     */
    public void doTest() throws Exception {
        final AtomicBoolean failed = new AtomicBoolean();

        for (int i = 0; i < GRID_CNT; i++) {
            final int idx = i;

            final Ignite grid = concurrent ? null : startGrid(idx);

            IgniteInternalFuture<?> fut = multithreadedAsync(new Runnable() {
                @Override
                public void run() {
                    Random rnd = new Random();

                    try {
                        Ignite ignite = grid == null ? startGrid(idx) : grid;

                        IgniteCache cache = getCache(ignite);

                        cache.put(ignite.cluster().localNode().id(), UUID.randomUUID());

                        while (!stopped) {
                            int val = Math.abs(rnd.nextInt(100));
                            if (val >= 0 && val < 40)
                                cache.containsKey(ignite.cluster().localNode().id());
                            else if (val >= 40 && val < 80)
                                cache.get(ignite.cluster().localNode().id());
                            else
                                cache.put(ignite.cluster().localNode().id(), UUID.randomUUID());

                            Thread.sleep(50);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();

                        failed.set(true);
                    }
                }
            }, 1);

            futs.add(fut);
        }

        Thread.sleep(10000);

        stopped = true;

        for (IgniteInternalFuture<?> fut : futs)
            fut.get();

        assertFalse(failed.get());
    }

    /**
     * @param grid Grid.
     */
    private IgniteCache getCache(Ignite grid) {
        CacheConfiguration ccfg = defaultCacheConfiguration();

        ccfg.setCacheMode(CacheMode.PARTITIONED);
        ccfg.setAtomicityMode(CacheAtomicityMode.ATOMIC);
        ccfg.setBackups(1);
        ccfg.setNearConfiguration(null);

        return grid.getOrCreateCache(ccfg);
    }
}