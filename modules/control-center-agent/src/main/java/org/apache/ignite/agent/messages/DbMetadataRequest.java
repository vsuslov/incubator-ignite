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

package org.apache.ignite.agent.messages;

import java.util.*;

/**
 *
 */
public class DbMetadataRequest extends AbstractMessage {
    /** */
    private String jdbcDriverJarPath;

    /** */
    private String jdbcDriverClass;

    /** */
    private String jdbcUrl;

    /** */
    private Properties jdbcInfo;

    /** */
    private boolean tablesOnly;

    /**
     * @return JDBC driver class name.
     */
    public String getJdbcDriverClass() {
        return jdbcDriverClass;
    }

    /**
     * @param jdbcDriverCls Jdbc driver class.
     */
    public void setJdbcDriverClass(String jdbcDriverCls) {
        this.jdbcDriverClass = jdbcDriverCls;
    }

    /**
     *
     */
    public String getJdbcUrl() {
        return jdbcUrl;
    }

    /**
     * @param jdbcUrl Jdbc url.
     */
    public void setJdbcUrl(String jdbcUrl) {
        this.jdbcUrl = jdbcUrl;
    }

    /**
     *
     */
    public Properties getJdbcInfo() {
        return jdbcInfo;
    }

    /**
     * @param jdbcInfo Jdbc info.
     */
    public void setJdbcInfo(Properties jdbcInfo) {
        this.jdbcInfo = jdbcInfo;
    }

    /**
     *
     */
    public String getJdbcDriverJarPath() {
        return jdbcDriverJarPath;
    }

    /**
     * @param jdbcDriverJarPath Jdbc drv jar path.
     */
    public void setJdbcDriverJarPath(String jdbcDriverJarPath) {
        this.jdbcDriverJarPath = jdbcDriverJarPath;
    }

    /**
     * @return Tables only flag.
     */
    public boolean isTablesOnly() {
        return tablesOnly;
    }

    /**
     * @param tblsOnly Tables only.
     */
    public void setTablesOnly(boolean tblsOnly) {
        this.tablesOnly = tblsOnly;
    }
}
