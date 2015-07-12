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

import org.eclipse.jetty.websocket.client.*;

import java.net.*;

/**
 *
 */
public class AgentLauncher {
    /**
     * @param args Args.
     */
    public static void main(String[] args) throws Exception {
        String login = args[0];
        String pwd = args[1];

        AgentConfiguration cfg = new AgentConfiguration();

        cfg.setLogin(login);
        cfg.setPassword(pwd);

        if (args.length > 2)
            cfg.setUri("ws://localhost:8088");
        else
            cfg.setUri(args[2]);

        WebSocketClient client = new WebSocketClient();

        Agent agent = new Agent(cfg);

        client.start();

        try {
            client.connect(agent, new URI(cfg.getUri()));

            System.out.printf("Connecting to : %s%n", cfg.getUri());

            agent.waitForClose();
        }
        finally {
            client.stop();
        }
    }
}
