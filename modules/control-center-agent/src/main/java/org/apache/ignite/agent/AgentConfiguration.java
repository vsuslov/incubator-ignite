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

import java.net.*;

/**
 *
 */
public class AgentConfiguration {
    /** */
    public static final URI DFLT_NODE_URI = URI.create("http://localhost:8080");

    /** todo set something like wss://control-center.gridgain.com */
    public static final URI DFLT_SERVER_URI = URI.create("wss://localhost:3001");

    /** */
    private String login;

    /** */
    private String pwd;

    /** */
    private URI serverUri = DFLT_SERVER_URI;

    /** */
    private URI nodeUri = DFLT_NODE_URI;

    /**
     *
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
     *
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
     *
     */
    public URI getServerUri() {
        return serverUri;
    }

    /**
     * @param srvUri Uri.
     */
    public void setServerUri(URI srvUri) {
        this.serverUri = srvUri;
    }

    /**
     *
     */
    public URI getNodeUri() {
        return nodeUri;
    }

    /**
     * @param nodeUri Node uri.
     */
    public void setNodeUri(URI nodeUri) {
        this.nodeUri = nodeUri;
    }
}
