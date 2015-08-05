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

import com.beust.jcommander.*;
import org.apache.ignite.agent.handlers.*;
import org.eclipse.jetty.websocket.client.*;

import java.io.*;
import java.net.*;
import java.util.logging.*;

/**
 * Control Center Agent launcher.
 */
public class AgentLauncher {
    /** Static initializer. */
    static {
        AgentLoggingConfigurator.configure();
    }

    /** */
    private static final Logger log = Logger.getLogger(AgentLauncher.class.getName());

    /** */
    private static final int RECONNECT_INTERVAL = 3000;

    /** */
    private final AgentConfiguration cfg;

    /**
     * @param cfg Config.
     */
    public AgentLauncher(AgentConfiguration cfg) {
        this.cfg = cfg;
    }

    /**
     *
     */
    public void run() throws Exception {
        RestExecutor restExecutor = new RestExecutor(cfg);

        try {
            WebSocketClient client = new WebSocketClient(cfg.sslContextFactory());

            client.setMaxIdleTimeout(Long.MAX_VALUE);

            client.start();

            try {
                while (!Thread.interrupted()) {
                    AgentSocket agentSock = new AgentSocket(cfg, restExecutor, new DatabaseMetadataExtractor(cfg));

                    log.log(Level.INFO, "Connecting to: " + cfg.getServerUri());

                    client.connect(agentSock, URI.create(cfg.getServerUri()));

                    agentSock.waitForClose();

                    Thread.sleep(RECONNECT_INTERVAL);
                }
            }
            finally {
                client.stop();
            }
        }
        finally {
            restExecutor.stop();
        }
    }

    /**
     * @param args Args.
     */
    public static void main(String[] args) throws Exception {
        log.log(Level.INFO, "Starting Apache Ignite Control Center Agent...");

        AgentConfiguration cfg = new AgentConfiguration();

        AgentConfiguration cmdCfg = new AgentConfiguration();

        JCommander jCommander = new JCommander(cmdCfg, args);

        if (cmdCfg.help()) {
            jCommander.usage();

            return;
        }

        if (cmdCfg.getConfigPath() != null)
            cfg.load(new File(cmdCfg.getConfigPath()).toURI().toURL());

        cfg.merge(cmdCfg);

        if (cfg.getLogin() == null) {
            System.out.print("Login: ");

            cfg.setLogin(System.console().readLine().trim());
        }

        if (cfg.getPassword() == null) {
            System.out.print("Password: ");

            cfg.setPassword(new String(System.console().readPassword()));
        }

        AgentLauncher agentLauncher = new AgentLauncher(cfg);

        agentLauncher.run();
    }
}
