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
import org.apache.ignite.internal.util.typedef.internal.*;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

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
    private final ConcurrentHashMap<Long, QueryCursorIterator> qryCurs = new ConcurrentHashMap<>();

    /**
     * @param ctx Context.
     */
    public QueryCommandHandler(GridKernalContext ctx) {
        super(ctx);

        final long idleQryCurTimeout = ctx.config().getConnectorConfiguration().getIdleQueryCursorTimeout();

        long qryCheckFrq = ctx.config().getConnectorConfiguration().getIdleQueryCursorCheckFrequency();

        ctx.timeout().schedule(new Runnable() {
            @Override public void run() {
                long time = U.currentTimeMillis();

                for (Map.Entry<Long, QueryCursorIterator> e : qryCurs.entrySet()) {
                    QueryCursorIterator val = e.getValue();

                    long createTime = val.timestamp();

                    if (createTime + idleQryCurTimeout > time)
                        if (val.lock().tryLock()) {
                            try {
                                val.timestamp(-1);

                                qryCurs.remove(e.getKey(), val);

                                val.close();
                            }
                            finally {
                                val.lock().unlock();
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
                    new ExecuteQueryCallable(ctx, (RestSqlQueryRequest)req, qryCurs), false);
            }

            case FETCH_SQL_QUERY: {
                return ctx.closure().callLocalSafe(
                    new FetchQueryCallable((RestSqlQueryRequest)req, qryCurs), false);
            }

            case CLOSE_SQL_QUERY: {
                return ctx.closure().callLocalSafe(
                    new CloseQueryCallable((RestSqlQueryRequest)req, qryCurs), false);
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

        /** Current queries cursors. */
        private final ConcurrentHashMap<Long, QueryCursorIterator> qryCurs;

        /**
         * @param ctx Kernal context.
         * @param req Execute query request.
         * @param qryCurs Query cursors.
         */
        public ExecuteQueryCallable(GridKernalContext ctx, RestSqlQueryRequest req,
            ConcurrentHashMap<Long, QueryCursorIterator> qryCurs) {
            this.ctx = ctx;
            this.req = req;
            this.qryCurs = qryCurs;
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
                        "Failed to find cache with name: " + req.cacheName());

                final QueryCursor qryCur = cache.query(qry);

                Iterator cur = qryCur.iterator();

                QueryCursorIterator val = new QueryCursorIterator(qryCur, cur);

                val.lock().lock();

                try {
                    qryCurs.put(qryId, val);

                    CacheQueryResult res = createQueryResult(cur, req, qryId, qryCurs);

                    List<GridQueryFieldMetadata> fieldsMeta = ((QueryCursorImpl<?>) qryCur).fieldsMeta();

                    res.setFieldsMetadata(convertMetadata(fieldsMeta));

                    return new GridRestResponse(res);
                }
                finally {
                    val.lock().unlock();
                }
            }
            catch (Exception e) {
                removeQueryCursor(qryId, qryCurs);

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

        /** Current queries cursors. */
        private final ConcurrentHashMap<Long, QueryCursorIterator> qryCurs;

        /**
         * @param req Execute query request.
         * @param qryCurs Query cursors.
         */
        public CloseQueryCallable(RestSqlQueryRequest req, ConcurrentHashMap<Long, QueryCursorIterator> qryCurs) {
            this.req = req;
            this.qryCurs = qryCurs;
        }

        /** {@inheritDoc} */
        @Override public GridRestResponse call() throws Exception {
            try {
                QueryCursorIterator val = qryCurs.get(req.queryId());

                if (val == null)
                    return new GridRestResponse(true);

                val.lock().lock();

                try{
                    if (val.timestamp() == -1)
                        return new GridRestResponse(true);

                    val.timestamp(-1);

                    val.close();

                    qryCurs.remove(req.queryId());
                }
                finally {
                    val.lock().unlock();
                }

                return new GridRestResponse(true);
            }
            catch (Exception e) {
                removeQueryCursor(req.queryId(), qryCurs);

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

        /** Current queries cursors. */
        private final ConcurrentHashMap<Long, QueryCursorIterator> qryCurs;

        /**
         * @param req Execute query request.
         * @param qryCurs Query cursors.
         */
        public FetchQueryCallable(RestSqlQueryRequest req, ConcurrentHashMap<Long, QueryCursorIterator> qryCurs) {
            this.req = req;
            this.qryCurs = qryCurs;
        }

        /** {@inheritDoc} */
        @Override public GridRestResponse call() throws Exception {
            try {
                QueryCursorIterator val = qryCurs.get(req.queryId());

                if (val == null)
                    return new GridRestResponse(GridRestResponse.STATUS_FAILED,
                        "Failed to find query with ID: " + req.queryId());

                val.lock().lock();

                try {
                    if (val.timestamp() == -1)
                        return new GridRestResponse(GridRestResponse.STATUS_FAILED,
                            "Query is closed by timeout. Restart query with ID: " + req.queryId());

                    val.timestamp(U.currentTimeMillis());

                    Iterator cur = val.iterator();

                    CacheQueryResult res = createQueryResult(cur, req, req.queryId(), qryCurs);

                    return new GridRestResponse(res);
                }
                finally {
                    val.lock().unlock();
                }
            }
            catch (Exception e) {
                removeQueryCursor(req.queryId(), qryCurs);

                return new GridRestResponse(GridRestResponse.STATUS_FAILED, e.getMessage());
            }
        }
    }

    /**
     * @param cur Current cursor.
     * @param req Sql request.
     * @param qryId Query id.
     * @param qryCurs Query cursors.
     * @return Query result with items.
     */
    private static CacheQueryResult createQueryResult(Iterator cur, RestSqlQueryRequest req, Long qryId,
        ConcurrentHashMap<Long, QueryCursorIterator> qryCurs) {
        CacheQueryResult res = new CacheQueryResult();

        List<Object> items = new ArrayList<>();

        for (int i = 0; i < req.pageSize() && cur.hasNext(); ++i)
            items.add(cur.next());

        res.setItems(items);

        res.setLast(!cur.hasNext());

        res.setQueryId(qryId);

        if (!cur.hasNext())
            removeQueryCursor(qryId, qryCurs);

        return res;
    }

    /**
     * Removes query cursor.
     *
     * @param qryId Query id.
     * @param qryCurs Query cursors.
     */
    private static void removeQueryCursor(Long qryId, ConcurrentHashMap<Long, QueryCursorIterator> qryCurs) {
        QueryCursorIterator t = qryCurs.get(qryId);

        if (t == null)
            return;

        t.lock().lock();

        try{
            if (t.timestamp() == -1)
                return;

            t.close();

            qryCurs.remove(qryId);
        }
        finally {
            t.lock().unlock();
        }
    }

    /**
     * Query cursor iterator.
     */
    private static class QueryCursorIterator {
        /** Query cursor. */
        private QueryCursor cur;

        /** Query iterator. */
        private Iterator iter;

        /** Last timestamp. */
        private volatile long timestamp;

        /** Reentrant lock. */
        private final ReentrantLock lock = new ReentrantLock();

        /**
         * @param cur Query cursor.
         * @param iter Query iterator.
         */
        public QueryCursorIterator(QueryCursor cur, Iterator iter) {
            this.cur = cur;
            this.iter = iter;
            timestamp = U.currentTimeMillis();
        }

        /**
         * @return Lock.
         */
        public ReentrantLock lock() {
            return lock;
        }

        /**
         * @return Query iterator.
         */
        public Iterator iterator() {
            return iter;
        }

        /**
         * @return Timestamp.
         */
        public long timestamp() {
            return timestamp;
        }

        /**
         * @param time Current time or -1 if cursor is closed.
         */
        public void timestamp(long time) {
            timestamp = time;
        }

        /**
         * Close query cursor.
         */
        public void close() {
            cur.close();
        }
    }
}
