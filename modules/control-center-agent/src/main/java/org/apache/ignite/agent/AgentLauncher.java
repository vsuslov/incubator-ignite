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

import org.apache.commons.cli.*;
import org.eclipse.jetty.util.ssl.*;
import org.eclipse.jetty.websocket.client.*;

import java.net.*;

/**
 *
 */
public class AgentLauncher {
    /** */
    private static final Options options = new Options()
        .addOption("l", "login", true, "User's login (email) on web-control-center")
        .addOption("p", "password", true, "User's password")
        .addOption("u", "url", true, "web-control-center URL");

    /**
     *
     */
    private static void printHelp() {
        HelpFormatter helpFormatter = new HelpFormatter();

        helpFormatter.printHelp("\njava -jar control-center-agent.jar -l myemail@gmail.com -p qwerty", options);
    }

    /**
     * @param args Args.
     */
    public static void main(String[] args) throws Exception {
        CommandLineParser parser = new BasicParser();

        CommandLine cmd = parser.parse(options, args);

        String login = cmd.getOptionValue('l');

        if (login == null) {
            System.out.println("Login is not specified.");

            printHelp();

            System.exit(1);
        }

        String pwd = cmd.getOptionValue('p');

        if (pwd == null) {
            System.out.println("Password is not specified.");

            printHelp();

            System.exit(1);
        }

        AgentConfiguration cfg = new AgentConfiguration();

        cfg.setLogin(login);
        cfg.setPassword(pwd);

        String uri = cmd.getOptionValue('u');

        if (uri == null)
            cfg.setUri("wss://localhost:3001"); // todo set something like wss://control-center.gridgain.com
        else
            cfg.setUri(uri);

        Agent agent = new Agent(cfg);

        agent.start();

        try {
            SslContextFactory sslCtxFactory = new SslContextFactory();

            if (Boolean.TRUE.equals(Boolean.getBoolean("trust.all")))
                sslCtxFactory.setTrustAll(true);

            WebSocketClient client = new WebSocketClient(sslCtxFactory);

            AgentSocket agentSock = new AgentSocket(cfg, agent);

            client.start();

            try {
                client.connect(agentSock, new URI(cfg.getUri()));

                System.out.printf("Connecting to : %s%n", cfg.getUri());

                agentSock.waitForClose();
            }
            finally {
                client.stop();
            }
        }
        finally {
            agent.stop();
        }
    }
}
