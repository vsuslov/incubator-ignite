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

package org.apache.ignite.agent;

import java.io.*;
import java.net.*;
import java.util.*;

/**
 * Agent configuration.
 */
public class AgentConfiguration {
    /** */
    private String login;

    /** */
    private String pwd;

    /** */
    private URI serverUri;

    /** */
    private URI nodeUri;

    /**
     * @return Login.
     */
    public String getLogin() {
        return login;
    }

    /**
     * @param login Login.
     */
    public void setLogin(String login) {
        this.login = login;
    }

    /**
     * @return Password.
     */
    public String getPassword() {
        return pwd;
    }

    /**
     * @param pwd Password.
     */
    public void setPassword(String pwd) {
        this.pwd = pwd;
    }

    /**
     * @return Server URI.
     */
    public URI getServerUri() {
        return serverUri;
    }

    /**
     * @param srvUri URI.
     */
    public void setServerUri(URI srvUri) {
        this.serverUri = srvUri;
    }

    /**
     * @return Node URI.
     */
    public URI getNodeUri() {
        return nodeUri;
    }

    /**
     * @param nodeUri Node URI.
     */
    public void setNodeUri(URI nodeUri) {
        this.nodeUri = nodeUri;
    }

    /**
     * @param cfgUrl URL.
     */
    public void load(URL cfgUrl) throws IOException {
        Properties props = new Properties();

        try (Reader reader = new InputStreamReader(cfgUrl.openStream())) {
            props.load(reader);
        }

        String val = (String)props.remove("login");

        if (val != null)
            setLogin(val);

        val = (String)props.remove("password");

        if (val != null)
            setPassword(val);

        val = (String)props.remove("serverURI");

        if (val != null)
            setServerUri(URI.create(val));

        val = (String)props.remove("nodeURI");

        if (val != null)
            setNodeUri(URI.create(val));
    }

    /**
     * @param cmd Command.
     */
    public void assign(AgentCommandLine cmd) {
        if (cmd.getLogin() != null)
            setLogin(cmd.getLogin());

        if (cmd.getPassword() != null)
            setPassword(cmd.getPassword());

        if (cmd.getServerUri() != null)
            setServerUri(URI.create(cmd.getServerUri()));

        if (cmd.getNodeUri() != null)
            setNodeUri(URI.create(cmd.getNodeUri()));
    }
}
