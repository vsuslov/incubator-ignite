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
import org.apache.ignite.*;
import org.apache.ignite.configuration.*;
import org.apache.ignite.spi.discovery.tcp.*;
import org.apache.ignite.spi.discovery.tcp.ipfinder.vm.*;
import org.eclipse.jetty.server.*;
import org.eclipse.jetty.servlet.*;
import org.eclipse.jetty.websocket.jsr356.server.ServerContainer;
import org.eclipse.jetty.websocket.jsr356.server.deploy.*;
import org.eclipse.jetty.websocket.server.*;
import org.jetbrains.annotations.*;
import org.junit.*;

import javax.websocket.*;
import javax.websocket.server.*;
import java.io.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

import static org.junit.Assert.*;

/**
 *
 */
public class AbstractAgentTestCase {
    /** */
    protected static final int REST_PORT = 8792;

    /** */
    protected static final int WEB_SOCKET_PORT = 8387;

    /** */
    protected static final BlockingQueue<EventSocket> clientConns = new LinkedBlockingQueue<>();

    /**
     *
     */
    @BeforeClass
    public static void startIgnite() {
        IgniteConfiguration cfg = new IgniteConfiguration();

        cfg.setLocalHost("127.0.0.1");

        cfg.setDiscoverySpi(new TcpDiscoverySpi().setIpFinder(new TcpDiscoveryVmIpFinder(true)));

        ConnectorConfiguration ccfg = new ConnectorConfiguration();

        cfg.setConnectorConfiguration(ccfg);

        System.setProperty(IgniteSystemProperties.IGNITE_JETTY_PORT, String.valueOf(REST_PORT));

        Ignition.start(cfg);
    }

    /**
     *
     */
    protected Server startWebSocket() throws Exception {
        WebSocketServerFactory s = new WebSocketServerFactory();

        Server webSockSrv = new Server();
        ServerConnector connector = new ServerConnector(webSockSrv);
        connector.setPort(WEB_SOCKET_PORT);
        webSockSrv.addConnector(connector);

        // Setup the basic application "context" for this application at "/"
        // This is also known as the handler tree (in jetty speak)
        ServletContextHandler ctx = new ServletContextHandler(ServletContextHandler.SESSIONS);
        ctx.setContextPath("/");
        webSockSrv.setHandler(ctx);

        // Initialize javax.websocket layer
        ServerContainer wscontainer = WebSocketServerContainerInitializer.configureContext(ctx);

        // Add WebSocket endpoint to javax.websocket layer
        wscontainer.addEndpoint(EventSocket.class);

        webSockSrv.start();

        s.start();

        return webSockSrv;
    }

    /**
     *
     */
    @Before
    public void validate() {
        assert clientConns.isEmpty();
    }

    /**
     * @return REST port.
     */
    protected int restPort() {
        return REST_PORT;
    }

    /**
     *
     */
    @AfterClass
    public static void stopIgnite() {
        Ignite ignite = Ignition.ignite();

        ignite.close();
    }

    /**
     *
     */
    @ClientEndpoint
    @ServerEndpoint(value = "/")
    public static class EventSocket {
        /** */
        private final AtomicLong msgCnt = new AtomicLong();

        /** */
        private Session ses;

        /** */
        private final SynchronousQueue<String> incomeMsgQueue = new SynchronousQueue<>();

        /**
         * @param ses Session.
         */
        @OnOpen
        public void onWebSocketConnect(Session ses) {
            this.ses = ses;

            clientConns.add(this);
        }

        /**
         * @param msg Message.
         */
        @OnMessage
        public void onWebSocketText(String msg) {
            incomeMsgQueue.add(msg);
        }

//        /**
//         * @param reason Reason.
//         */
//        @OnClose
//        public void onWebSocketClose(CloseReason reason) {
//            // No
//        }

        /**
         * @param cause Cause.
         */
        @OnError
        public void onWebSocketError(Throwable cause) {
            cause.printStackTrace(System.err);
        }

        /**
         * @return Session.
         */
        public Session session() {
            return ses;
        }

        /**
         * @return Incoming message.
         */
        public JsonObject receiveMessage() throws InterruptedException {
            String msgStr = incomeMsgQueue.take();

            return (JsonObject)AgentUtils.PARSER.parse(msgStr);
        }

        /**
         * @param mtdName Method name.
         * @param args Args.
         */
        public JsonElement sendAndWait(String mtdName, Object ... args) throws IOException, InterruptedException {
            long reqId = msgCnt.incrementAndGet();

            sendMessage(reqId, mtdName, args);

            JsonObject res = receiveMessage();

            assertEquals(reqId, res.get("reqId").getAsLong());

            return res.get("res");
        }

        /**
         * @param mtdName Method name.
         * @param args Args.
         */
        public void sendMessage(String mtdName, Object ... args) throws IOException {
            sendMessage(null, mtdName, args);
        }

        /**
         * @param reqId Request id.
         * @param mtdName Method name.
         * @param args Args.
         */
        private void sendMessage(@Nullable Long reqId, String mtdName, Object ... args) throws IOException {
            JsonObject json = new JsonObject();

            json.addProperty("mtdName", mtdName);

            if (reqId != null)
                json.addProperty("reqId", reqId);

            JsonArray argsJson = new JsonArray();

            for (Object arg : args)
                argsJson.add(AgentUtils.GSON.toJsonTree(arg));

            json.add("args", argsJson);

            ses.getBasicRemote().sendText(AgentUtils.GSON.toJson(json));
        }
    }

    /**
     * @param login Login.
     */
    protected AgentConfiguration createAgentConfig(String login) {
        AgentConfiguration agentCfg = new AgentConfiguration();
        agentCfg.setLogin(login);
        agentCfg.setPassword("1");

        agentCfg.setServerUri("ws://localhost:" + WEB_SOCKET_PORT);
        agentCfg.setNodeUri("http://localhost:" + restPort());

        return agentCfg;
    }

    /**
     * @param msg Message.
     * @param login Login.
     * @param pwd Password.
     */
    protected void validateAuth(JsonObject msg, String login, String pwd) {
        assertEquals("AuthMessage", msg.get("type").getAsString());
        assertEquals(login, msg.get("login").getAsString());
        assertEquals(pwd, msg.get("password").getAsString());
    }
}
