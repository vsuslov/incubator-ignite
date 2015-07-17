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

import org.apache.ignite.internal.util.typedef.internal.*;
import org.apache.logging.log4j.*;

import java.net.*;

/**
 * TODO: Add class description.
 */
public class ContextTestTmp {
    public static final String CONSOLE_APPENDER = "consoleAppender";
    public static final String CONSOLE_CTX = "consoleContext";
    public static final String CONSOLE_LOG = "consoleLogger";

    public static void main(String[] args) throws Exception {
        final Level maxLevel = Level.DEBUG;

        final URL cfgUrl = U.resolveIgniteUrl("modules/core/src/test/config/log4j2-verbose-test.xml");

        org.apache.logging.log4j.core.Logger logger = Log4J2Logger.createConsoleLogger(null, null);

        logTest(logger);

        logTest(LogManager.getContext().getLogger(LogManager.ROOT_LOGGER_NAME));

        logTest(LogManager.getContext().getLogger("Some_another_class"));
    }

    private static void logTest(Logger logger) {
        logger.log(Level.OFF, "*******************");
        logger.log(Level.FATAL, "*******************");
        logger.log(Level.ERROR, "*******************");
        logger.log(Level.WARN, "*******************");
        logger.log(Level.INFO, "*******************");
        logger.log(Level.DEBUG, "*******************");
        logger.log(Level.TRACE, "*******************");
        logger.log(Level.ALL, "*******************");

        System.out.println();
        System.out.println();
    }
}
