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

import org.apache.commons.codec.*;
import org.apache.http.*;
import org.apache.http.client.methods.*;
import org.apache.http.impl.client.*;
import org.apache.ignite.agent.messages.*;

import java.io.*;
import java.nio.charset.*;

/**
 *
 */
public class Agent {
    /** */
    private final AgentConfiguration cfg;

    /** */
    private CloseableHttpClient httpclient;

    /**
     * @param cfg Config.
     */
    public Agent(AgentConfiguration cfg) {
        this.cfg = cfg;
    }

    /**
     *
     */
    public void start() {
        httpclient = HttpClientBuilder.create().build();
    }

    /**
     *
     */
    public void stop() throws IOException {
        if (httpclient != null)
            httpclient.close();
    }

    /**
     * @param uri Url.
     */
    public RestResult executeRest(String uri) throws IOException {
        HttpGet get = new HttpGet(uri);

        CloseableHttpResponse resp = httpclient.execute(get);

        RestResult res = new RestResult();

        res.setCode(resp.getStatusLine().getStatusCode());

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        resp.getEntity().writeTo(out);

        Charset charset = Charsets.UTF_8;

        Header encodingHdr = resp.getEntity().getContentEncoding();

        if (encodingHdr != null) {
            String encoding = encodingHdr.getValue();

            charset = Charsets.toCharset(encoding);
        }

        res.setMessage(new String(out.toByteArray(), charset));

        return res;
    }
}
