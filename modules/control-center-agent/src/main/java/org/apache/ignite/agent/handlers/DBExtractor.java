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

package org.apache.ignite.agent.handlers;

import org.apache.ignite.agent.remote.*;
import org.apache.ignite.schema.parser.*;

import java.sql.*;
import java.util.*;

/**
 * Remote API to extract DB metadata.
 */
public class DBExtractor {
    /**
     * @param jdbcDriverJarPath JDBC driver JAR path.
     * @param jdbcDriverCls JDBC driver class.
     * @param jdbcUrl JDBC URL.
     * @param jdbcInfo Properties to connect to database.
     *
     * @return Collection of tables.
     */
    @Remote
    public Collection<DbTable> extractMetadata(String jdbcDriverJarPath, String jdbcDriverCls, String jdbcUrl,
        Properties jdbcInfo, boolean tblsOnly) throws SQLException {
        Connection conn = DBReader.getInstance().connect(jdbcDriverJarPath, jdbcDriverCls, jdbcUrl, jdbcInfo);

        return DBReader.getInstance().extractMetadata(conn, tblsOnly);
    }
}
