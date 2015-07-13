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

import org.apache.ignite.agent.messages.*;
import org.eclipse.jetty.websocket.api.*;
import org.eclipse.jetty.websocket.api.annotations.*;

import java.io.*;
import java.util.concurrent.*;

/**
 *
 */
@WebSocket
public class AgentSocket {
    /** */
    private final CountDownLatch closeLatch = new CountDownLatch(1);

    /** */
    private final AgentConfiguration cfg;

    /** */
    private final Agent agent;

    /**
     * @param cfg Config.
     */
    public AgentSocket(AgentConfiguration cfg, Agent agent) {
        this.cfg = cfg;
        this.agent = agent;
    }

    /**
     * @param statusCode Status code.
     * @param reason Reason.
     */
    @OnWebSocketClose
    public void onClose(int statusCode, String reason) {
        System.out.printf("Connection closed: %d - %s%n", statusCode, reason);

        closeLatch.countDown();
    }

    /**
     * @param ses Session.
     */
    @OnWebSocketConnect
    public void onConnect(Session ses) {
        System.out.println("Authentication...");

        AuthMessage authMsg = new AuthMessage(cfg.getLogin(), cfg.getPassword());

        try {
            ses.getRemote().sendString(MessageFactory.toString(authMsg));
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }

    /**
     * @param ses Session.
     * @param error Error.
     */
    @OnWebSocketError
    public void onError(Session ses, Throwable error) {
        System.out.printf("Error: " + ses);

        error.printStackTrace();

        closeLatch.countDown();
    }

    /**
     * @param msg Message.
     */
    @OnWebSocketMessage
    public void onMessage(Session ses, String msg) {
        AbstractMessage m = MessageFactory.fromString(msg);

        if (m instanceof AuthResult) {
            if (((AuthResult)m).isSuccess())
                System.out.println("Authentication success");
            else {
                System.out.println("Authentication failed: " + ((AuthResult)m).getMessage());

                ses.close();
            }
        }
        else if (m instanceof ExecuteRest) {
            ExecuteRest execRest = (ExecuteRest)m;

            RestResult res;

            try {
                res = agent.executeRest(execRest.getUrl());
            }
            catch (IOException e) {
                res = new RestResult();

                res.setCode(500);
            }

            try {
                ses.getRemote().sendString(MessageFactory.toString(res));
            }
            catch (IOException e) {
                e.printStackTrace();
            }
        }
        else
            System.err.printf("Unknown message: %s%n", msg);
    }

    /**
     *
     */
    public void waitForClose() throws InterruptedException {
        closeLatch.await();
    }
}
