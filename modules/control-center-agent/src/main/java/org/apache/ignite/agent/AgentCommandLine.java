package org.apache.ignite.agent;/*
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

import com.beust.jcommander.*;

/**
 * Command line bean.
 */
public class AgentCommandLine {
    /** */
    @Parameter(names = {"-l", "--login"}, description = "User's login (email) on web-control-center")
    private String login;

    /** */
    @Parameter(names = {"-p", "--password"}, description = "User's password")
    private String pwd;

    /** */
    @Parameter(names = {"-s", "--serverUri"}, description = "Link to web-control-center web-socket server, for example: wss://control-center.gridgain.com")
    private String serverUri;

    /** */
    @Parameter(names = {"-n", "--nodeUri"}, description = "ignite REST server, for example: http://localhost:8080")
    private String nodeUri;

    /** */
    @Parameter(names = {"-c", "--config"}, description = "Path to configuration file")
    private String cfgPath;

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
    public String getServerUri() {
        return serverUri;
    }

    /**
     * @param srvUri Server uri.
     */
    public void setServerUri(String srvUri) {
        serverUri = srvUri;
    }

    /**
     * @return Node URI.
     */
    public String getNodeUri() {
        return nodeUri;
    }

    /**
     * @param nodeUri Node uri.
     */
    public void setNodeUri(String nodeUri) {
        this.nodeUri = nodeUri;
    }

    /**
     * @return Config file URL.
     */
    public String getConfigFile() {
        return cfgPath;
    }

    /**
     * @param cfgPath Config path.
     */
    public void setConfigPath(String cfgPath) {
        this.cfgPath = cfgPath;
    }
}
