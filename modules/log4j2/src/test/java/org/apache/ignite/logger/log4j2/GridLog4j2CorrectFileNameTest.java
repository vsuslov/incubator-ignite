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
import org.apache.ignite.configuration.*;
import org.apache.ignite.internal.util.typedef.*;
import org.apache.ignite.internal.util.typedef.internal.*;
import org.apache.ignite.testframework.junits.common.*;

import java.io.*;

/**
 * Tests that several grids log to files with correct names.
 */
@GridCommonTest(group = "Logger")
public class GridLog4j2CorrectFileNameTest extends TestCase {
    /**
     * Tests correct behaviour in case 2 local nodes are started.
     *
     * @throws Exception If error occurs.
     */
    public void testLogFilesTwoNodes() throws Exception {
        checkOneNode(0);
        checkOneNode(1);
    }

    /**
     * Starts the local node and checks for presence of log file.
     * Also checks that this is really a log of a started node.
     *
     * @param id Test-local node ID.
     * @throws Exception If error occurred.
     */
    private void checkOneNode(int id) throws Exception {
        String id8;
        String logPath;

        try (Ignite ignite = G.start(getConfiguration("grid" + id))) {
            id8 = U.id8(ignite.cluster().localNode().id());

            logPath = "work/log/ignite-" + id8 + ".log";

            assertEquals(logPath, ignite.log().fileName());
        }

        File logFile = U.resolveIgnitePath(logPath);

        assertNotNull("Failed to resolve path: " + logPath, logFile);
        assertTrue("Log file does not exist: " + logFile, logFile.exists());
        // We have a row in log with the following content
        // con >>> Local node [ID=NodeId ]
        String logContent = U.readFileToString(logFile.getAbsolutePath(), "UTF-8");

        assertTrue("Log file does not contain it's node ID: " + logFile,
            logContent.contains(">>> Local node [ID="+ id8.toUpperCase()));

    }

    /**
     * Creates grid configuration.
     *
     * @param gridName Grid name.
     * @return Grid configuration.
     * @throws Exception If error occurred.
     */
    private static IgniteConfiguration getConfiguration(String gridName)
        throws Exception {
        IgniteConfiguration cfg = new IgniteConfiguration();

        cfg.setGridName(gridName);

        cfg.setGridLogger(new Log4J2Logger("config/ignite-log4j2.xml"));
        cfg.setConnectorConfiguration(null);

        return cfg;
    }
}
