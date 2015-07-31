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

package org.apache.ignite.agent.messages;

import java.util.*;

/**
 *
 */
public class RestRequest extends AbstractMessage {
    /** */
    private int id;

    /** */
    private String path;

    /** */
    private Map<String, String> params;

    /** */
    private String method;

    /** */
    private Map<String, String> headers;

    /** */
    private String body;

    /**
     *
     */
    public int getId() {
        return id;
    }

    /**
     * @param id Id.
     */
    public void setId(int id) {
        this.id = id;
    }

    /**
     *
     */
    public String getPath() {
        return path;
    }

    /**
     * @param path Url.
     */
    public void setPath(String path) {
        this.path = path;
    }

    /**
     *
     */
    public Map<String, String> getParams() {
        return params;
    }

    /**
     * @param params Params.
     */
    public void setParams(Map<String, String> params) {
        this.params = params;
    }

    /**
     *
     */
    public String getMethod() {
        return method;
    }

    /**
     * @param mtd Method.
     */
    public void setMethod(String mtd) {
        method = mtd;
    }

    /**
     *
     */
    public Map<String, String> getHeaders() {
        return headers;
    }

    /**
     * @param headers Headers.
     */
    public void setHeaders(Map<String, String> headers) {
        this.headers = headers;
    }

    /**
     *
     */
    public String getBody() {
        return body;
    }

    /**
     * @param body Body.
     */
    public void setBody(String body) {
        this.body = body;
    }
}
