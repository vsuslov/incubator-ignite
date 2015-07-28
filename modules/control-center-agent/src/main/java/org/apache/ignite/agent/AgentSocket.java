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

import org.apache.http.*;
import org.apache.ignite.agent.messages.*;
import org.eclipse.jetty.websocket.api.*;
import org.eclipse.jetty.websocket.api.annotations.*;

import java.io.*;
import java.net.*;
import java.util.concurrent.*;
import java.util.logging.*;

/**
 *
 */
@WebSocket
public class AgentSocket {
    /** */
    private static final Logger log = Logger.getLogger(AgentSocket.class.getName());

    /** */
    private final CountDownLatch closeLatch = new CountDownLatch(1);

    /** */
    private final AgentConfiguration cfg;

    /** */
    private final Agent agent;

    /** */
    private Session ses;

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
        log.log(Level.INFO, String.format("Connection closed: %d - %s", statusCode, reason));

        closeLatch.countDown();
    }

    /**
     * @param ses Session.
     */
    @OnWebSocketConnect
    public void onConnect(Session ses) {
        log.log(Level.INFO, "Authentication...");

        this.ses = ses;

        AuthMessage authMsg = new AuthMessage(cfg.getLogin(), cfg.getPassword());

        try {
            ses.getRemote().sendString(MessageFactory.toString(authMsg));
        } catch (IOException t) {
            t.printStackTrace();
        }
    }

    /**
     * @param msg Message.
     */
    public boolean send(AbstractMessage msg) {
        return send(MessageFactory.toString(msg));
    }

    /**
     * @param msg Message.
     */
    public boolean send(String msg) {
        try {
            ses.getRemote().sendString(msg);

            return true;
        }
        catch (IOException e) {
            log.log(Level.SEVERE, "Failed to send message to Control Center");

            return false;
        }
    }

    /**
     * @param ses Session.
     * @param error Error.
     */
    @OnWebSocketError
    public void onError(Session ses, Throwable error) {
        if (error instanceof ConnectException)
            log.log(Level.INFO, error.getMessage());
        else
            log.log(Level.SEVERE, "Connection error", error);

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
                log.info("Authentication success");
            else {
                log.info("Authentication failed: " + ((AuthResult)m).getMessage());

                ses.close();
            }
        }
        else if (m instanceof RestRequest) {
            RestRequest restReq = (RestRequest)m;

            RestResult restRes;

            try {
                restRes = agent.executeRest(restReq);
            }
            catch (Exception e) {
                restRes = new RestResult();

                restRes.setCode(HttpStatus.SC_INTERNAL_SERVER_ERROR);
                restRes.setMessage(e.getMessage());
            }

            restRes.setRequestId(((RestRequest)m).getId());

            send(MessageFactory.toString(restRes));
        }
        else if (m instanceof DbMetadataRequest) {
            DbMetadataResponse resp = agent.dbMetadataRequest((DbMetadataRequest)m);

            send(resp);
        }
        else
            log.log(Level.SEVERE, "Unknown message: " + msg);
    }

    /**
     *
     */
    public void waitForClose() throws InterruptedException {
        closeLatch.await();
    }
}
