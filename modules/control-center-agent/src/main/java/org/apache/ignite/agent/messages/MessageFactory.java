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

import com.google.gson.*;

/**
 *
 */
public class MessageFactory {
    /** */
    private static final Gson gson = new Gson();

    /** */
    private static final JsonParser parser = new JsonParser();

    /**
     * Default constructor.
     */
    private MessageFactory() {
        // No-op.
    }

    /**
     * @param msg Message.
     */
    public static String toString(AbstractMessage msg) {
        assert msg.getClass().getPackage().equals(MessageFactory.class.getPackage());

        JsonObject json = (JsonObject)gson.toJsonTree(msg);

        json.addProperty("type", msg.getClass().getSimpleName());

        return gson.toJson(json);
    }

    /**
     * @param jsonStr Json string.
     */
    public static AbstractMessage fromString(String jsonStr) {
        JsonElement jsonElement = parser.parse(jsonStr);

        if (!(jsonElement instanceof JsonObject))
            throw new IllegalArgumentException();

        JsonObject json = (JsonObject)jsonElement;

        String type = json.getAsJsonPrimitive("type").getAsString();

        Class<? extends AbstractMessage> cls;

        try {
            cls = (Class<? extends AbstractMessage>)Class.forName(MessageFactory.class.getPackage().getName() + '.' + type);
        }
        catch (ClassNotFoundException e) {
            throw new IllegalArgumentException(e);
        }

        return gson.fromJson(json, cls);
    }
}
