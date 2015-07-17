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
import java.nio.charset.*;

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

        String loggerName = LogManager.ROOT_LOGGER_NAME;

        Configurator.initialize(loggerName, cfgUrl.toString());

        LoggerContext context= (LoggerContext) LogManager.getContext();
        Configuration config= context.getConfiguration();

        PatternLayout layout= PatternLayout.createLayout("%m%n", null, null, Charset.defaultCharset(),false,false,null,null);
        Appender appender=ConsoleAppender.createAppender(layout, null, null, "CONSOLE_APPENDER", null, null);
        appender.start();
        AppenderRef ref= AppenderRef.createAppenderRef("CONSOLE_APPENDER",null,null);
        AppenderRef[] refs = new AppenderRef[] {ref};
        LoggerConfig loggerConfig= LoggerConfig.createLogger("false", Level.INFO,"CONSOLE_LOGGER","CONSOLE_LOGGER",refs,null,null,null);
        loggerConfig.addAppender(appender,null,null);

        config.addAppender(appender);
        config.addLogger("CONSOLE_LOGGER", loggerConfig);
        context.updateLoggers(config);

        Logger logger=LogManager.getContext().getLogger("CONSOLE_LOGGER");
        logger.info("HELLO_WORLD");

        logTest(logger);
        logTest(LogManager.getRootLogger());

        System.out.println("FInish");
    }

    private static void doIt(org.apache.logging.log4j.core.Logger log){
        ConsoleAppender console = ConsoleAppender.createAppender(PatternLayout.createDefaultLayout(), null,
            "SYSTEM_OUT", "consoleApp", null, null);

        final LoggerContext ctx = (LoggerContext)LogManager.getContext(false);

        final Configuration cfg = ctx.getConfiguration();

        console.start();

        cfg.addAppender(console);

        AppenderRef ref = AppenderRef.createAppenderRef("consoleApp", null, null);

        LoggerConfig loggerConfig = LoggerConfig.createLogger("true", Level.ALL, LogManager.ROOT_LOGGER_NAME,
            "true", new AppenderRef[] {ref}, null, cfg, null );

        loggerConfig.addAppender(console, null, null);

        cfg.addLogger(LogManager.ROOT_LOGGER_NAME, loggerConfig);

        ctx.updateLoggers();
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
    }

    private static void addConsoleAppender(final Logger logger, final Level maxLevel) {
        ConsoleAppender appender = ConsoleAppender.createAppender(PatternLayout.createDefaultLayout(), null,
            "SYSTEM_OUT", CONSOLE_APPENDER, null, null);

        final LoggerContext ctx = (LoggerContext) LogManager.getContext(false);

        final Configuration cfg = ctx.getConfiguration();

        appender.start();

        cfg.addAppender(appender);

        LoggerConfig loggerConfig = cfg.getLoggerConfig(logger.getName());

        AppenderRef ref = AppenderRef.createAppenderRef(CONSOLE_APPENDER, maxLevel, null);

        loggerConfig.getAppenderRefs().add(ref);

        loggerConfig.addAppender(appender, maxLevel, null);

        cfg.addLogger(logger.getName(), loggerConfig);

        ctx.updateLoggers();
    }
}
