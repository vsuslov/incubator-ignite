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

import com.google.gson.*;
import org.eclipse.jetty.server.*;
import org.junit.*;

/**
 *
 */
public class AgentTest extends AbstractAgentTestCase {
    /**
     *
     */
    @Test
    public void testAvailableDrivers() throws Exception {
        Server srv = startWebSocket();

        try {
            final AgentLauncher l = new AgentLauncher(createAgentConfig("1"));

            Thread agentThread = new Thread(new Runnable() {
                @Override public void run() {
                    try {
                        l.run();
                    }
                    catch (InterruptedException ignored) {
                        // No-op.
                    }
                    catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                }
            });

            agentThread.start();

            try {
                EventSocket conn = clientConns.take();

                JsonObject msg = conn.receiveMessage();

                validateAuth(msg, l.config().getLogin(), l.config().getPassword());

                conn.sendMessage("authResult", (Object)null);

                JsonElement resp = conn.sendAndWait("availableDrivers");

                Assert.assertTrue(resp instanceof JsonArray);
            }
            finally {
                agentThread.interrupt();

                agentThread.join();
            }
        }
        finally {
            srv.stop();
        }
    }

    /**
     *
     */
    @Test
    public void testAgentReconnect() throws Exception {
        final AgentLauncher l = new AgentLauncher(createAgentConfig("1"));

        Thread agentThread = new Thread(new Runnable() {
            @Override public void run() {
                try {
                    l.run();
                }
                catch (InterruptedException ignored) {
                    // No-op.
                }
                catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
        });

        agentThread.start();

        try {
            Server srv = startWebSocket();

            try {
                clientConns.take(); // Wait for agent connection.
            }
            finally {
                srv.stop();
            }

            srv = startWebSocket();

            try {
                EventSocket conn = clientConns.take();

                JsonObject msg = conn.receiveMessage();

                validateAuth(msg, l.config().getLogin(), l.config().getPassword());

                conn.sendMessage("authResult", (Object)null);
            }
            finally {
                srv.stop();
            }
        }
        finally {
            agentThread.interrupt();

            agentThread.join();
        }
    }
}
