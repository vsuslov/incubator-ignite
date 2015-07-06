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

package org.apache.ignite.cache.affinity.rendezvous;

import org.apache.ignite.*;
import org.apache.ignite.cache.affinity.*;

import java.lang.reflect.*;

/**
 * Tests for {@link RendezvousAffinityFunction}.
 */
public class RendezvousAffinityFunctionSelfTest extends AbstractAffinityFunctionSelfTest {
    /** Ignite. */
    private static Ignite ignite;

    /** {@inheritDoc} */
    @Override protected void beforeTestsStarted() throws Exception {
        ignite = startGrid();
    }

    /** {@inheritDoc} */
    @Override protected void afterTestsStopped() throws Exception {
        stopAllGrids();
    }

    /** {@inheritDoc} */
    @Override protected AffinityFunction affinityFunction() {
        AffinityFunction aff = new RendezvousAffinityFunction();

        try {
            Field field = aff.getClass().getDeclaredField("ignite");

            field.setAccessible(true);

            field.set(aff, ignite);
        }
        catch (NoSuchFieldException | IllegalAccessException e) {
            throw new RuntimeException(e);
        }

        return aff;
    }
}
