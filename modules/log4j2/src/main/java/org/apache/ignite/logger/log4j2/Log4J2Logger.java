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

import org.apache.ignite.*;
import org.apache.ignite.internal.util.tostring.*;
import org.apache.ignite.internal.util.typedef.*;
import org.apache.ignite.internal.util.typedef.internal.*;
import org.apache.ignite.lang.*;
import org.apache.ignite.logger.*;
import org.apache.logging.log4j.*;
import org.apache.logging.log4j.core.*;
import org.apache.logging.log4j.core.Logger;
import org.apache.logging.log4j.core.appender.*;
import org.apache.logging.log4j.core.appender.routing.*;
import org.apache.logging.log4j.core.config.*;
import org.apache.logging.log4j.core.layout.*;
import org.jetbrains.annotations.*;

import java.io.*;
import java.lang.reflect.*;
import java.net.*;
import java.nio.charset.*;
import java.util.*;

import static org.apache.ignite.IgniteSystemProperties.*;

/**
 * Log4j2-based implementation for logging. This logger should be used
 * by loaders that have prefer <a target=_new href="http://logging.apache.org/log4j/2.x/index.html">log4j2</a>-based logging.
 * <p>
 * Here is a typical example of configuring log4j2 logger in Ignite configuration file:
 * <pre name="code" class="xml">
 *      &lt;property name="gridLogger"&gt;
 *          &lt;bean class="org.apache.ignite.logger.log4j2.Log4J2Logger"&gt;
 *              &lt;constructor-arg type="java.lang.String" value="config/ignite-log4j2.xml"/&gt;
 *          &lt;/bean>
 *      &lt;/property&gt;
 * </pre>
 * and from your code:
 * <pre name="code" class="java">
 *      IgniteConfiguration cfg = new IgniteConfiguration();
 *      ...
 *      URL xml = U.resolveIgniteUrl("config/custom-log4j2.xml");
 *      IgniteLogger log = new Log4J2Logger(xml);
 *      ...
 *      cfg.setGridLogger(log);
 * </pre>
 *
 * Please take a look at <a target=_new href="http://logging.apache.org/log4j/2.x/index.html">Apache Log4j 2</a>
 * for additional information.
 * <p>
 * It's recommended to use Ignite logger injection instead of using/instantiating
 * logger in your task/job code. See {@link org.apache.ignite.resources.LoggerResource} annotation about logger
 * injection.
 */
public class Log4J2Logger implements IgniteLogger, LoggerNodeIdAware {
    /** */
    public static final String NODE_ID = "nodeId";

    /** */
    public static final String CONSOLE_APPENDER = "autoConfiguredIgniteConsoleAppender";
    public static final String CONSOLE_LOGGER_NAME = LogManager.ROOT_LOGGER_NAME;

    /** */
    private static volatile boolean inited;

    /** */
    private static volatile boolean quiet0;

    /** */
    private static final Object mux = new Object();

    /** Logger implementation. */
    @GridToStringExclude
    @SuppressWarnings("FieldAccessedSynchronizedAndUnsynchronized")
    private Logger impl;

    private volatile Logger consoleLogger;

    /** Quiet flag. */
    private final boolean quiet;

    /** Node ID. */
    private volatile UUID nodeId;

    /**
     * Creates new logger with given implementation.
     *
     * @param impl Log4j implementation to use.
     * @param consoleLogger
     */
    public Log4J2Logger(final Logger impl, Logger consoleLogger) {
        assert impl != null;
        this.consoleLogger = consoleLogger;

        addConsoleAppenderIfNeeded(new C1<Boolean, Logger>() {
            @Override public Logger apply(Boolean init) {
                return impl;
            }
        });

        quiet = quiet0;
    }

    /**
     * Creates new logger with given configuration {@code path}.
     *
     * @param path Path to log4j configuration XML file.
     * @throws IgniteCheckedException Thrown in case logger can't be created.
     */
    public Log4J2Logger(String path) throws IgniteCheckedException {
        if (path == null)
            throw new IgniteCheckedException("Configuration XML file for Log4j must be specified.");

        final URL cfgUrl = U.resolveIgniteUrl(path);

        if (cfgUrl == null)
            throw new IgniteCheckedException("Log4j configuration path was not found: " + path);

        addConsoleAppenderIfNeeded(new C1<Boolean, Logger>() {
            @Override public Logger apply(Boolean init) {
                if (init)
                    Configurator.initialize(LogManager.ROOT_LOGGER_NAME, cfgUrl.toString());

                return (Logger)LogManager.getRootLogger();
            }
        });

        quiet = quiet0;
    }

    /**
     * Creates new logger with given configuration {@code cfgFile}.
     *
     * @param cfgFile Log4j configuration XML file.
     * @throws IgniteCheckedException Thrown in case logger can't be created.
     */
    public Log4J2Logger(File cfgFile) throws IgniteCheckedException {
        if (cfgFile == null)
            throw new IgniteCheckedException("Configuration XML file for Log4j must be specified.");

        if (!cfgFile.exists() || cfgFile.isDirectory())
            throw new IgniteCheckedException("Log4j2 configuration path was not found or is a directory: " + cfgFile);

        final String path = cfgFile.getAbsolutePath();

        addConsoleAppenderIfNeeded(new C1<Boolean, Logger>() {
            @Override public Logger apply(Boolean init) {
                if (init)
                    Configurator.initialize(LogManager.ROOT_LOGGER_NAME, path);

                return (Logger)LogManager.getRootLogger();
            }
        });

        quiet = quiet0;
    }

    /**
     * Creates new logger with given configuration {@code cfgUrl}.
     *
     * @param cfgUrl URL for Log4j configuration XML file.
     * @throws IgniteCheckedException Thrown in case logger can't be created.
     */
    public Log4J2Logger(final URL cfgUrl) throws IgniteCheckedException {
        if (cfgUrl == null)
            throw new IgniteCheckedException("Configuration XML file for Log4j must be specified.");

        addConsoleAppenderIfNeeded(new C1<Boolean, Logger>() {
            @Override public Logger apply(Boolean init) {
                if (init)
                    Configurator.initialize(LogManager.ROOT_LOGGER_NAME, cfgUrl.toString());

                return (Logger)LogManager.getRootLogger();
            }
        });

        quiet = quiet0;
    }

    /**
     * Sets level for internal log4j implementation.
     *
     * @param level Log level to set.
     */
    public void setLevel(Level level) {
        LoggerContext ctx = (LoggerContext)LogManager.getContext(false);

        Configuration conf = ctx.getConfiguration();

        conf.getLoggerConfig(impl.getName()).setLevel(level);

        ctx.updateLoggers(conf);
    }

    /** {@inheritDoc} */
    @Nullable @Override public String fileName() {
        for (Logger log = impl; log != null; log = log.getParent()) {
            for (Appender a : log.getAppenders().values()) {
                if (a instanceof FileAppender)
                    return ((FileAppender)a).getFileName();

                if (a instanceof RollingFileAppender)
                    return ((RollingFileAppender)a).getFileName();

                if (a instanceof RoutingAppender) {
                    try {
                        RoutingAppender routing = (RoutingAppender)a;

                        Field appsFiled = routing.getClass().getDeclaredField("appenders");

                        appsFiled.setAccessible(true);

                        Map<String, AppenderControl> appenders = (Map<String, AppenderControl>)appsFiled.get(routing);

                        for (AppenderControl control : appenders.values()) {
                            Appender innerApp = control.getAppender();

                            if (innerApp instanceof FileAppender)
                                return ((FileAppender)innerApp).getFileName();

                            if (innerApp instanceof RollingFileAppender)
                                return ((RollingFileAppender)innerApp).getFileName();
                        }
                    }
                    catch (IllegalAccessException | NoSuchFieldException e) {
                        error("Faild to get file name. Looks like the implementation of log4j 2 was changed.", e);
                    }
                }
            }
        }

        return null;
    }

    /**
     * Adds console appender when needed with some default logging settings.
     *
     * @param initLogClo Optional log implementation init closure.
     */
    private void addConsoleAppenderIfNeeded(@Nullable IgniteClosure<Boolean, Logger> initLogClo) {
        if (inited) {
            if (initLogClo != null)
                // Do not init.
                impl = initLogClo.apply(false);

            return;
        }

        synchronized (mux) {
            if (inited) {
                if (initLogClo != null)
                    // Do not init.
                    impl = initLogClo.apply(false);

                return;
            }

            if (initLogClo != null)
                // Init logger impl.
                impl = initLogClo.apply(true);

            boolean quiet = Boolean.valueOf(System.getProperty(IGNITE_QUIET, "true"));

            boolean consoleAppenderFound = false;
            Logger rootLogger = null;
            ConsoleAppender errAppender = null;

            for (Logger log = impl; log != null; ) {
                if (!consoleAppenderFound) {
                    for (Appender appender : log.getAppenders().values()) {
                        if (appender instanceof ConsoleAppender) {
                            if ("CONSOLE_ERR".equals(appender.getName())) {
                                // Treat CONSOLE_ERR appender as a system one and don't count it.
                                errAppender = (ConsoleAppender)appender;

                                continue;
                            }

                            consoleAppenderFound = true;

                            break;
                        }
                    }
                }

                if (log.getParent() == null) {
                    rootLogger = log;

                    break;
                }
                else
                    log = log.getParent();
            }

            if (consoleAppenderFound && quiet)
                // User configured console appender, but log is quiet.
                quiet = false;

            if (!consoleAppenderFound && !quiet && Boolean.valueOf(System.getProperty(IGNITE_CONSOLE_APPENDER, "true"))) {
                // Console appender not found => we've looked through all categories up to root.
                assert rootLogger != null;

                // User launched ignite in verbose mode and did not add console appender with INFO level
                // to configuration and did not set IGNITE_CONSOLE_APPENDER to false.
                if (errAppender != null) {
                    consoleLogger = createConsoleLogger(rootLogger, Level.ALL);

//                    if (errAppender.getThreshold() == Level.ERROR)
//                        errAppender.setThreshold(Level.WARN);
                }
                else
                    // No error console appender => create console appender with no level limit.
                    consoleLogger = createConsoleLogger(rootLogger, Level.INFO);
            }

            quiet0 = quiet;
            inited = true;
        }
    }

//    private void createConsoleLogger(Logger logger, Level maxLevel) {
//        final LoggerContext ctx = (LoggerContext) LogManager.getContext(false);
//
//        final Configuration cfg = ctx.getConfiguration();
//
//        ConsoleAppender appender = ConsoleAppender.createAppender(PatternLayout.createDefaultLayout(), null,
//            "SYSTEM_OUT", CONSOLE_APPENDER, null, null);
//
//        appender.start();
//
//        cfg.addAppender(appender);
//
//        LoggerConfig oldLogCfg = cfg.getLoggerConfig(logger.getName());
//
//        AppenderRef ref = AppenderRef.createAppenderRef(CONSOLE_APPENDER, Level.ALL, null);
//
//        LoggerConfig newLogCfg = LoggerConfig.createLogger("false", oldLogCfg.getLevel(),
//            oldLogCfg.getName(), "true", new AppenderRef[]{ref}, null, cfg, null);
//
//        newLogCfg.addAppender(appender, Level.ALL, null);
//
//        cfg.addLogger(logger.getName(), oldLogCfg);
//
//        ctx.reconfigure();
//        ctx.updateLoggers();
//    }

    /**
     * Creates console appender with some reasonable default logging settings.
     *
     * @param maxLevel Max logging level.
     * @return New console appender.
     */
    // TODO review.
//    private void createConsoleLogger(Logger log, Level maxLevel) {
//        ConsoleAppender consoleApp = ConsoleAppender.createAppender(PatternLayout.createDefaultLayout(), null,
//            "SYSTEM_OUT", CONSOLE_APPENDER, null, null);
//
//        final LoggerContext ctx = log.getContext();
//
//        final Configuration cfg = ctx.getConfiguration();
//
//        consoleApp.start();
//
//        cfg.addAppender(consoleApp);
//
//        AppenderRef ref = AppenderRef.createAppenderRef(CONSOLE_APPENDER, null, null);
//
//        LoggerConfig logCfg = LoggerConfig.createLogger("true", null, log.getName(),
//            "true", new AppenderRef[] {ref}, null, cfg, null);
//
//        logCfg.getAppenderRefs().add(ref);
//
//        cfg.addLogger(log.getName(), logCfg);
//
//        ctx.updateLoggers();
//
//        return consoleApp;
//    }
    /**
     * Creates console appender with some reasonable default logging settings.
     *
     * @param maxLevel Max logging level.
     * @return New console appender.
     */
    // TODO review.
    public static Logger createConsoleLogger(Logger log, Level maxLevel) {
//        ((Log4jContextFactory)LogManager.getFactory()).getSelector().

        LoggerContext context= (LoggerContext) LogManager.getContext(true);
        Configuration config= context.getConfiguration();

        PatternLayout layout= PatternLayout.createLayout("[%d{ABSOLUTE}][%-5p][%t][%c{1}] %m%n", null, null, Charset.defaultCharset(),false,false,null,null);
        Appender appender=ConsoleAppender.createAppender(layout, null, null, "CONSOLE_APPENDER", null, null);
        appender.start();
        AppenderRef ref= AppenderRef.createAppenderRef("CONSOLE_APPENDER",null,null);
        AppenderRef[] refs = new AppenderRef[] {ref};
        LoggerConfig loggerConfig= LoggerConfig.createLogger("false", Level.INFO,CONSOLE_LOGGER_NAME,"",refs,null,null,null);
        loggerConfig.addAppender(appender,null,null);

        config.addAppender(appender);
        config.addLogger(CONSOLE_LOGGER_NAME, loggerConfig);
        context.updateLoggers(config);

        return (Logger)LogManager.getContext().getLogger(CONSOLE_LOGGER_NAME);
    }

    /** {@inheritDoc} */
    @Override public void setNodeId(UUID nodeId) {
        A.notNull(nodeId, "nodeId");

        this.nodeId = nodeId;

        // Set nodeId as system variable to be used at configuration.
        System.setProperty(NODE_ID, U.id8(nodeId));

        ((LoggerContext) LogManager.getContext(false)).reconfigure();

        // Hack. To touch the logger to create all log resources (files). Then #fileName() will work properly.
        impl.log(Level.OFF, "");
    }

    /** {@inheritDoc} */
    @Override public UUID getNodeId() {
        return nodeId;
    }

    /**
     * Gets {@link IgniteLogger} wrapper around log4j logger for the given
     * category. If category is {@code null}, then root logger is returned. If
     * category is an instance of {@link Class} then {@code (Class)ctgr).getName()}
     * is used as category name.
     *
     * @param ctgr {@inheritDoc}
     * @return {@link IgniteLogger} wrapper around log4j logger.
     */
    @Override public Log4J2Logger getLogger(Object ctgr) {
        if (ctgr == null)
            return new Log4J2Logger((Logger)LogManager.getRootLogger(), (Logger)LogManager.getContext().getLogger(""));

        if (ctgr instanceof Class) {
            String name = ((Class<?>)ctgr).getName();
            return new Log4J2Logger((Logger)LogManager.getLogger(name), (Logger)LogManager.getContext().getLogger(name));
        }

        String name = ctgr.toString();
        return new Log4J2Logger((Logger)LogManager.getLogger(name), (Logger)LogManager.getContext().getLogger(name));
    }

    /** {@inheritDoc} */
    @Override public void trace(String msg) {
        if (!impl.isTraceEnabled())
            warning("Logging at TRACE level without checking if TRACE level is enabled: " + msg);

        impl.trace(msg);

        if (consoleLogger != null) consoleLogger.trace(msg);
    }

    /** {@inheritDoc} */
    @Override public void debug(String msg) {
        if (!impl.isDebugEnabled())
            warning("Logging at DEBUG level without checking if DEBUG level is enabled: " + msg);

        impl.debug(msg);
        if (consoleLogger != null) consoleLogger.debug(msg);
    }

    /** {@inheritDoc} */
    @Override public void info(String msg) {
        if (!impl.isInfoEnabled())
            warning("Logging at INFO level without checking if INFO level is enabled: " + msg);

        impl.info(msg);

        if (consoleLogger != null) consoleLogger.info(msg);
    }

    /** {@inheritDoc} */
    @Override public void warning(String msg) {
        impl.warn(msg);
        if (LogManager.getContext().getLogger(CONSOLE_LOGGER_NAME) != null) LogManager.getContext().getLogger(CONSOLE_LOGGER_NAME).warn(msg);
    }

    /** {@inheritDoc} */
    @Override public void warning(String msg, @Nullable Throwable e) {
        impl.warn(msg, e);
        if (consoleLogger != null) consoleLogger.warn(msg, e);
    }

    /** {@inheritDoc} */
    @Override public void error(String msg) {
        impl.error(msg);
        if (consoleLogger != null) consoleLogger.error(msg);
    }

    /** {@inheritDoc} */
    @Override public void error(String msg, @Nullable Throwable e) {
        impl.error(msg, e);
        if (consoleLogger != null) consoleLogger.error(msg, e);
    }

    /** {@inheritDoc} */
    @Override public boolean isTraceEnabled() {
        return impl.isTraceEnabled();
    }

    /** {@inheritDoc} */
    @Override public boolean isDebugEnabled() {
        return impl.isDebugEnabled();
    }

    /** {@inheritDoc} */
    @Override public boolean isInfoEnabled() {
        return impl.isInfoEnabled();
    }

    /** {@inheritDoc} */
    @Override public boolean isQuiet() {
        return quiet;
    }

    /** {@inheritDoc} */
    @Override public String toString() {
        return S.toString(Log4J2Logger.class, this);
    }
}
