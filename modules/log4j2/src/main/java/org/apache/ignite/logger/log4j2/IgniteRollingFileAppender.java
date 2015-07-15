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

import org.apache.ignite.lang.*;
import org.apache.logging.log4j.core.*;
import org.apache.logging.log4j.core.appender.*;
import org.apache.logging.log4j.core.appender.rolling.*;
import org.apache.logging.log4j.core.config.*;
import org.apache.logging.log4j.core.config.plugins.*;

import java.io.*;

/**
* TODO
*/
@Plugin(name = "IgniteRollingFile", category = "Core", elementType = "appender", printObject = true)
public final class IgniteRollingFileAppender implements Appender, Serializable, Log4j2FileAware {
    /** */
    private static final long serialVersionUID = 0L;

    /** */
    private volatile RollingFileAppender a;

    /** */
    private IgniteRollingFileAppender(RollingFileAppender a) {
        this.a = a;
    }

    /**
     * Create a RollingFileAppender.
     * @param fileName The name of the file that is actively written to. (required).
     * @param filePattern The pattern of the file name to use on rollover. (required).
     * @param append If true, events are appended to the file. If false, the file
     * is overwritten when opened. Defaults to "true"
     * @param name The name of the Appender (required).
     * @param bufferedIO When true, I/O will be buffered. Defaults to "true".
     * @param bufferSizeStr buffer size for buffered IO (default is 8192).
     * @param immediateFlush When true, events are immediately flushed. Defaults to "true".
     * @param policy The triggering policy. (required).
     * @param strategy The rollover strategy. Defaults to DefaultRolloverStrategy.
     * @param layout The layout to use (defaults to the default PatternLayout).
     * @param filter The Filter or null.
     * @param ignore If {@code "true"} (default) exceptions encountered when appending events are logged; otherwise
     *               they are propagated to the caller.
     * @param advertise "true" if the appender configuration should be advertised, "false" otherwise.
     * @param advertiseURI The advertised URI which can be used to retrieve the file contents.
     * @param config The Configuration.
     * @return A RollingFileAppender.
     */
    @PluginFactory
    public static IgniteRollingFileAppender createAppender(
        @PluginAttribute("fileName") final String fileName,
        @PluginAttribute("filePattern") final String filePattern,
        @PluginAttribute("append") final String append,
        @PluginAttribute("name") final String name,
        @PluginAttribute("bufferedIO") final String bufferedIO,
        @PluginAttribute("bufferSize") final String bufferSizeStr,
        @PluginAttribute("immediateFlush") final String immediateFlush,
        @PluginElement("Policy") final TriggeringPolicy policy,
        @PluginElement("Strategy") RolloverStrategy strategy,
        @PluginElement("Layout") Layout<? extends Serializable> layout,
        @PluginElement("Filter") final Filter filter,
        @PluginAttribute("ignoreExceptions") final String ignore,
        @PluginAttribute("advertise") final String advertise,
        @PluginAttribute("advertiseURI") final String advertiseURI,
        @PluginConfiguration final Configuration config) {

        RollingFileAppender a = RollingFileAppender.createAppender(
            fileName,
            filePattern,
            append,
            name,
            bufferedIO,
            bufferSizeStr,
            immediateFlush,
            policy,
            strategy,
            layout,
            filter,
            ignore,
            advertise,
            advertiseURI,
            config);

        return new IgniteRollingFileAppender(a);
    }

    /** {@inheritDoc} */
    @Override public void append(LogEvent event) {
        a.append(event);
    }

    /** {@inheritDoc} */
    @Override public String getName() {
        return a.getName();
    }

    /** {@inheritDoc} */
    @Override public Layout<? extends Serializable> getLayout() {
        return a.getLayout();
    }

    /** {@inheritDoc} */
    @Override public boolean ignoreExceptions() {
        return a.ignoreExceptions();
    }

    /** {@inheritDoc} */
    @Override public ErrorHandler getHandler() {
        return a.getHandler();
    }

    /** {@inheritDoc} */
    @Override public void setHandler(ErrorHandler handler) {
        a.setHandler(handler);
    }

    /** {@inheritDoc} */
    @Override public State getState() {
        return a.getState();
    }

    /** {@inheritDoc} */
    @Override public void start() {
        a.start();
    }

    /** {@inheritDoc} */
    @Override public void stop() {
        a.stop();
    }

    /** {@inheritDoc} */
    @Override public boolean isStarted() {
        return a.isStarted();
    }

    /** {@inheritDoc} */
    @Override public boolean isStopped() {
        return a.isStopped();
    }

    @Override public void updateFilePath(IgniteClosure<String, String> filePathClos) {
        System.out.println();
    }
}
