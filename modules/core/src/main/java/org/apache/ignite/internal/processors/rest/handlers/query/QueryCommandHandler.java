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

package org.apache.ignite.internal.processors.rest.handlers.query;

import org.apache.ignite.*;
import org.apache.ignite.cache.query.*;
import org.apache.ignite.internal.*;
import org.apache.ignite.internal.processors.cache.*;
import org.apache.ignite.internal.processors.query.*;
import org.apache.ignite.internal.processors.rest.*;
import org.apache.ignite.internal.processors.rest.handlers.*;
import org.apache.ignite.internal.processors.rest.request.*;
import org.apache.ignite.internal.util.future.*;
import org.apache.ignite.internal.util.lang.*;
import org.apache.ignite.internal.util.typedef.internal.*;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

import static org.apache.ignite.internal.processors.rest.GridRestCommand.*;

/**
 * Query command handler.
 */
public class QueryCommandHandler extends GridRestCommandHandlerAdapter {
    /** Supported commands. */
    private static final Collection<GridRestCommand> SUPPORTED_COMMANDS = U.sealList(EXECUTE_SQL_QUERY,
        EXECUTE_SQL_FIELDS_QUERY,
        FETCH_SQL_QUERY,
        CLOSE_SQL_QUERY);

    /** Query ID sequence. */
    private static final AtomicLong qryIdGen = new AtomicLong();

    /** Current queries cursors. */
    private final static ConcurrentHashMap<Long, GridTuple3<QueryCursor, Iterator, Long>> qryCurs =
        new ConcurrentHashMap<>();

    /**
     * @param ctx Context.
     */
    public QueryCommandHandler(GridKernalContext ctx) {
        super(ctx);

        final long idleQryCurTimeout = ctx.config().getConnectorConfiguration().getIdleQueryCursorTimeout();

        long qryCheckFrq = ctx.config().getConnectorConfiguration().getQueryCheckFrequency();

        ctx.timeout().schedule(new Runnable() {
            @Override public void run() {
                long time = System.currentTimeMillis();

                for (Map.Entry<Long, GridTuple3<QueryCursor, Iterator, Long>> e : qryCurs.entrySet()) {
                    synchronized (e.getValue()) {
                        long createTime = e.getValue().get3();

                        if (createTime + idleQryCurTimeout > time) {
                            e.getValue().get1().close();

                            qryCurs.remove(e.getKey());
                        }
                    }
                }
            }
        }, qryCheckFrq, qryCheckFrq);
    }

    /** {@inheritDoc} */
    @Override public Collection<GridRestCommand> supportedCommands() {
        return SUPPORTED_COMMANDS;
    }

    /** {@inheritDoc} */
    @Override public IgniteInternalFuture<GridRestResponse> handleAsync(GridRestRequest req) {
        assert req != null;

        assert SUPPORTED_COMMANDS.contains(req.command());
        assert req instanceof RestSqlQueryRequest : "Invalid type of query request.";

        switch (req.command()) {
            case EXECUTE_SQL_QUERY:
            case EXECUTE_SQL_FIELDS_QUERY: {
                return ctx.closure().callLocalSafe(
                    new ExecuteQueryCallable(ctx, (RestSqlQueryRequest)req), false);
            }

            case FETCH_SQL_QUERY: {
                return ctx.closure().callLocalSafe(
                    new FetchQueryCallable((RestSqlQueryRequest)req), false);
            }

            case CLOSE_SQL_QUERY: {
                return ctx.closure().callLocalSafe(
                    new CloseQueryCallable((RestSqlQueryRequest)req), false);
            }
        }

        return new GridFinishedFuture<>();
    }

    /**
     * Execute query callable.
     */
    private static class ExecuteQueryCallable implements Callable<GridRestResponse> {
        /** Kernal context. */
        private GridKernalContext ctx;

        /** Execute query request. */
        private RestSqlQueryRequest req;

        /**
         * @param ctx Kernal context.
         * @param req Execute query request.
         */
        public ExecuteQueryCallable(GridKernalContext ctx, RestSqlQueryRequest req) {
            this.ctx = ctx;
            this.req = req;
        }

        /** {@inheritDoc} */
        @Override public GridRestResponse call() throws Exception {
            final long qryId = qryIdGen.getAndIncrement();

            try {
                Query qry;

                if (req.typeName() != null) {
                    qry = new SqlQuery(req.typeName(), req.sqlQuery());

                    ((SqlQuery)qry).setArgs(req.arguments());
                }
                else {
                    qry = new SqlFieldsQuery(req.sqlQuery());

                    ((SqlFieldsQuery)qry).setArgs(req.arguments());
                }

                IgniteCache<Object, Object> cache = ctx.grid().cache(req.cacheName());

                if (cache == null)
                    return new GridRestResponse(GridRestResponse.STATUS_FAILED,
                        "No cache with name [cacheName=" + req.cacheName() + "]");

                final QueryCursor qryCur = cache.query(qry);

                Iterator cur = qryCur.iterator();

                GridTuple3<QueryCursor, Iterator, Long> val =
                    new GridTuple3<>(qryCur, cur, System.currentTimeMillis());

                synchronized (val) {
                    qryCurs.put(qryId, val);

                    CacheQueryResult res = createQueryResult(cur, req, qryId);

                    List<GridQueryFieldMetadata> fieldsMeta = ((QueryCursorImpl<?>) qryCur).fieldsMeta();

                    res.setFieldsMetadata(convertMetadata(fieldsMeta));

                    return new GridRestResponse(res);
                }
            }
            catch (Exception e) {
                removeQueryCursor(qryId);

                return new GridRestResponse(GridRestResponse.STATUS_FAILED, e.getMessage());
            }
        }

        /**
         * @param meta Internal query field metadata.
         * @return Rest query field metadata.
         */
        private Collection<CacheQueryFieldsMetaResult> convertMetadata(Collection<GridQueryFieldMetadata> meta) {
            List<CacheQueryFieldsMetaResult> res = new ArrayList<>();

            if (meta != null) {
                for (GridQueryFieldMetadata info : meta)
                    res.add(new CacheQueryFieldsMetaResult(info));
            }

            return res;
        }
    }

    /**
     * Close query callable.
     */
    private static class CloseQueryCallable implements Callable<GridRestResponse> {
        /** Execute query request. */
        private RestSqlQueryRequest req;

        /**
         * @param req Execute query request.
         */
        public CloseQueryCallable(RestSqlQueryRequest req) {
            this.req = req;
        }

        /** {@inheritDoc} */
        @Override public GridRestResponse call() throws Exception {
            try {
                GridTuple3<QueryCursor, Iterator, Long> val = qryCurs.get(req.queryId());

                if (val == null)
                    return new GridRestResponse(GridRestResponse.STATUS_FAILED,
                        "Cannot find query [qryId=" + req.queryId() + "]");

                synchronized (val) {
                    QueryCursor cur = val.get1();

                    cur.close();

                    qryCurs.remove(req.queryId());
                }

                return new GridRestResponse(true);
            }
            catch (Exception e) {
                removeQueryCursor(req.queryId());

                return new GridRestResponse(GridRestResponse.STATUS_FAILED, e.getMessage());
            }
        }
    }

    /**
     * Fetch query callable.
     */
    private static class FetchQueryCallable implements Callable<GridRestResponse> {
        /** Execute query request. */
        private RestSqlQueryRequest req;

        /**
         * @param req Execute query request.
         */
        public FetchQueryCallable(RestSqlQueryRequest req) {
            this.req = req;
        }

        /** {@inheritDoc} */
        @Override public GridRestResponse call() throws Exception {
            try {
                GridTuple3<QueryCursor, Iterator, Long> t = qryCurs.get(req.queryId());

                if (t == null)
                    return new GridRestResponse(GridRestResponse.STATUS_FAILED,
                        "Cannot find query [qryId=" + req.queryId() + "]");

                synchronized (t) {
                    t.set3(System.currentTimeMillis());

                    Iterator cur = t.get2();

                    CacheQueryResult res = createQueryResult(cur, req, req.queryId());

                    return new GridRestResponse(res);
                }
            }
            catch (Exception e) {
                removeQueryCursor(req.queryId());

                return new GridRestResponse(GridRestResponse.STATUS_FAILED, e.getMessage());
            }
        }
    }

    /**
     * @param cur Current cursor.
     * @param req Sql request.
     * @param qryId Query id.
     * @return Query result with items.
     */
    private static CacheQueryResult createQueryResult(Iterator cur, RestSqlQueryRequest req, Long qryId) {
        CacheQueryResult res = new CacheQueryResult();

        List<Object> items = new ArrayList<>();

        for (int i = 0; i < req.pageSize() && cur.hasNext(); ++i)
            items.add(cur.next());

        res.setItems(items);

        res.setLast(!cur.hasNext());

        res.setQueryId(qryId);

        if (!cur.hasNext())
            removeQueryCursor(qryId);

        return res;
    }

    /**
     * Removes query cursor.
     *
     * @param qryId Query id.
     */
    private static void removeQueryCursor(Long qryId) {
        GridTuple3<QueryCursor, Iterator, Long> t = qryCurs.get(qryId);

        if (t != null) {
            synchronized (t) {
                t.get1().close();

                qryCurs.remove(qryId);
            }
        }
    }
}
