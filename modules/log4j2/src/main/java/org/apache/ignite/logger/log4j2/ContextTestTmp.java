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
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.core.*;
import org.apache.logging.log4j.core.appender.*;
import org.apache.logging.log4j.core.config.*;
import org.apache.logging.log4j.core.layout.*;

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

        final URL cfgUrl = U.resolveIgniteUrl("config/ignite-log4j2.xml");

        Configurator.initialize(LogManager.ROOT_LOGGER_NAME, cfgUrl.toString());

//        addConsoleAppender(LogManager.getRootLogger(), Level.INFO);
//
//        logTest();

//        Appender appender = FileAppender.createAppender(U.getIgniteHome() + "/work/log/test.log", "false", "false", "File", "true",
//            "false", "false", "4000", PatternLayout.createDefaultLayout(), null, "false", null,
//            ((LoggerContext) LogManager.getContext(false)).getConfiguration());
//
//        addAppender(LogManager.getRootLogger(), appender, Level.INFO);

        System.out.println(((org.apache.logging.log4j.core.Logger)LogManager.getRootLogger()).getAppenders());

        Configuration cfg = ((LoggerContext)LogManager.getContext(false)).getConfiguration();
        System.out.println(cfg.getAppenders().containsKey("Console"));
//        System.out.println(cfg.getA.containsKey("Console"));

        logTest();
    }

    private static void logTest() {
        LogManager.getRootLogger().log(Level.OFF, "*******************");
        LogManager.getRootLogger().log(Level.FATAL, "*******************");
        LogManager.getRootLogger().log(Level.ERROR, "*******************");
        LogManager.getRootLogger().log(Level.WARN, "*******************");
        LogManager.getRootLogger().log(Level.INFO, "*******************");
        LogManager.getRootLogger().log(Level.DEBUG, "*******************");
        LogManager.getRootLogger().log(Level.TRACE, "*******************");
        LogManager.getRootLogger().log(Level.ALL, "*******************");
    }

    private static void addConsoleAppender(final Logger logger, final Level maxLevel) {
        final LoggerContext ctx = (LoggerContext) LogManager.getContext(false);

        final Configuration cfg = ctx.getConfiguration();

//        for (Appender a : loggerConfig.getAppenders().values()) {
//            if (a instanceof ConsoleAppender)
//                return;
//        }

        ConsoleAppender appender = ConsoleAppender.createAppender(PatternLayout.createDefaultLayout(), null,
            "SYSTEM_OUT", CONSOLE_APPENDER, null, null);

        appender.start();

        cfg.addAppender(appender);

        LoggerConfig oldLogCfg = cfg.getLoggerConfig(logger.getName());

        AppenderRef ref = AppenderRef.createAppenderRef(CONSOLE_APPENDER, maxLevel, null);

        LoggerConfig newLogCfg = LoggerConfig.createLogger("false", oldLogCfg.getLevel(),
            oldLogCfg.getName(), "true", new AppenderRef[]{ref}, null, cfg, null);

        newLogCfg.addAppender(appender, maxLevel, null);

        cfg.addLogger(logger.getName(), oldLogCfg);

        ctx.updateLoggers();
    }

    private static void addAppender(final Logger logger, Appender appender, final Level maxLevel) {
        final LoggerContext ctx = (LoggerContext) LogManager.getContext(false);

        final Configuration cfg = ctx.getConfiguration();

        appender.start();

        cfg.addAppender(appender);

        LoggerConfig loggerConfig = cfg.getLoggerConfig(logger.getName());

        AppenderRef ref = AppenderRef.createAppenderRef("File", maxLevel, null);

        loggerConfig.getAppenderRefs().add(ref);

        loggerConfig.addAppender(appender, maxLevel, null);

        cfg.addLogger(logger.getName(), loggerConfig);

        ctx.updateLoggers();
    }
}
