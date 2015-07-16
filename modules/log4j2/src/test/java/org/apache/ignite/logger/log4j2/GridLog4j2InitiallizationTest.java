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

package org.apache.ignite.logger.log4j2;

import junit.framework.*;
import org.apache.ignite.*;
import org.apache.ignite.internal.util.typedef.internal.*;
import org.apache.ignite.logger.*;
import org.apache.ignite.testframework.*;
import org.apache.ignite.testframework.junits.common.*;

import java.io.*;
import java.util.*;

/**
 * Grid Log4j2 SPI test.
 */
@GridCommonTest(group = "Logger")
public class GridLog4j2InitiallizationTest extends TestCase {
    /** */
    public static final String LOG_PATH = "modules/core/src/test/config/log4j2-test.xml";

    /**
     * @throws Exception If failed.
     */
    public void testFile() throws Exception {
        File xml = GridTestUtils.resolveIgnitePath(LOG_PATH);

        assert xml != null;
        assert xml.exists();

        IgniteLogger log = new Log4J2Logger(xml).getLogger(getClass());

        ((LoggerNodeIdAware) log).setNodeId(UUID.randomUUID());

        checkLog(log);
    }

    /**
     * @throws Exception If failed.
     */
    public void testUrl() throws Exception {
        File xml = GridTestUtils.resolveIgnitePath(LOG_PATH);

        assert xml != null;
        assert xml.exists();

        IgniteLogger log = new Log4J2Logger(xml.toURI().toURL()).getLogger(getClass());

        ((LoggerNodeIdAware) log).setNodeId(UUID.randomUUID());

        checkLog(log);
    }

    /**
     * @throws Exception If failed.
     */
    public void testPath() throws Exception {
        IgniteLogger log = new Log4J2Logger(LOG_PATH).getLogger(getClass());

        ((LoggerNodeIdAware) log).setNodeId(UUID.randomUUID());

        checkLog(log);
    }

    /**
     * Tests log4j logging SPI.
     */
    private void checkLog(IgniteLogger log) {
        assert !log.isDebugEnabled();
        assert log.isInfoEnabled();

        log.debug("This is 'debug' message.");
        log.info("This is 'info' message.");
        log.warning("This is 'warning' message.");
        log.warning("This is 'warning' message.", new Exception("It's a test warning exception"));
        log.error("This is 'error' message.");
        log.error("This is 'error' message.", new Exception("It's a test error exception"));
    }

    /**
     * @throws Exception If failed.
     */
    public void testSystemNodeId() throws Exception {
        UUID id = UUID.randomUUID();

        new Log4J2Logger().setNodeId(id);

        assertEquals(U.id8(id), System.getProperty("nodeId"));
    }
}
