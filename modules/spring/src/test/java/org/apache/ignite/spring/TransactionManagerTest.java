package org.apache.ignite.spring;

import org.apache.ignite.*;
import org.apache.ignite.cache.CacheAtomicityMode;
import org.apache.ignite.configuration.CacheConfiguration;
import org.apache.ignite.configuration.IgniteConfiguration;
import org.apache.ignite.transactions.Transaction;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import static org.junit.Assert.*;
import static org.junit.Assert.assertNotNull;

/**
 * Created by Suslov Vadim on 28/08/2015.
 */
public class TransactionManagerTest {

    private static PlatformTransactionManager txManager;
    private static TransactionTemplate txTemplate;

    private static Ignite ignite;
    private static IgniteCache<Long,String> cache;

    @BeforeClass
    public static void init() {
        ignite=startServer();
        initTxManager(ignite);
        cache=ignite.cache("cache");
    }

    @After
    public void doAfterTest() {
        cache.clear();
    }

    @Test
    public void testTx() {
        assertNull(ignite.transactions().tx());
        Transaction tx=ignite.transactions().txStart();
        assertNotNull(tx);
        assertNotNull(ignite.transactions().tx());
        tx.commit();
        assertNull(ignite.transactions().tx());
    }

    @Test
    public void doInsertSuccess() {
        assertNull(ignite.transactions().tx());

        txTemplate.execute(new TransactionCallback<Object>() {
            @Override
            public Object doInTransaction(TransactionStatus status) {
                assertNotNull(ignite.transactions().tx());
                cache.put(1l, "My Entity");
                return null;
            }
        });
        assertNull(ignite.transactions().tx());

        assertEquals("My Entity", cache.get(1l));
    }

    @Test
    public void doInsertFail() {
        try {
            txTemplate.execute(new TransactionCallback<Object>() {
                @Override
                public Object doInTransaction(TransactionStatus status) {
                    assertNotNull(ignite.transactions().tx());
                    cache.put(5l, "Second Entity");
                    throw new IgniteException("Rollback me");
                }
            });
        } catch(IgniteException ie) {
            // no-op
        }
        assertNull(ignite.transactions().tx());
        assertNull(cache.get(5l));
    }

    @Test
    public void pureTM() {
        TransactionStatus status=txManager.getTransaction(null);
        assertNotNull(ignite.transactions().tx());
        cache.put(1l, "Entity");
        txManager.commit(status);
        assertNull(ignite.transactions().tx());
    }

    public static IgniteConfiguration getConfig() {
        IgniteConfiguration iconfig=new IgniteConfiguration();
        iconfig.setLocalHost("localhost");

        CacheConfiguration cacheConfig=new CacheConfiguration();
        cacheConfig.setName("cache");
        cacheConfig.setAtomicityMode(CacheAtomicityMode.TRANSACTIONAL);

        iconfig.setCacheConfiguration(cacheConfig);
        return iconfig;
    }

    private static void initTxManager(Ignite ignite) {
        txManager=new IgniteSpringTransactionManager(ignite);
        txTemplate=new TransactionTemplate(txManager);
    }

    public static Ignite startServer() {
        return Ignition.start(getConfig());
    }

    public Ignite startClient() {
        IgniteConfiguration config= getConfig();
        config.setClientMode(true);
        return Ignition.start(config);
    }
}
