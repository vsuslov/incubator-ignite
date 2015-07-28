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

package org.apache.ignite.schema.parser;

import org.apache.ignite.schema.parser.dialect.*;

import java.sql.*;
import java.util.*;
import java.util.logging.*;

/**
 *
 */
public class DBReader {
    /** Logger. */
    private static final Logger log = Logger.getLogger(DBReader.class.getName());

    /**
     * Default constructor.
     */
    private DBReader() {
        // No-op.
    }

    /**
     * Extract DB metadata.
     *
     * @param conn Connection.
     * @param tblsOnly Tables only flag.
     */
    public static Collection<DbTable> extractMetadata(Connection conn, boolean tblsOnly) throws SQLException {
        DatabaseMetadataDialect dialect;

        try {
            String dbProductName = conn.getMetaData().getDatabaseProductName();

            if ("Oracle".equals(dbProductName))
                dialect = new OracleMetadataDialect();
            else if (dbProductName.startsWith("DB2/"))
                dialect = new DB2MetadataDialect();
            else
                dialect = new JdbcMetadataDialect();
        }
        catch (SQLException e) {
            log.log(Level.SEVERE, "Failed to resolve dialect (JdbcMetaDataDialect will be used.", e);

            dialect = new JdbcMetadataDialect();
        }

        return dialect.tables(conn, tblsOnly);
    }

}
