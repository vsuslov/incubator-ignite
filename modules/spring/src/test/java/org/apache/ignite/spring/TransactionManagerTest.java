package org.apache.ignite.spring;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.IgniteSpringTransactionManager;
import org.apache.ignite.Ignition;
import org.apache.ignite.configuration.CacheConfiguration;
import org.apache.ignite.configuration.IgniteConfiguration;
import org.junit.Before;
import org.junit.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import static org.junit.Assert.*;

/**
 * Created by Suslov Vadim on 28/08/2015.
 */
public class TransactionManagerTest {

    private PlatformTransactionManager txManager;
    private TransactionTemplate txTemplate;

    private Ignite ignite;

    @Before
    public void init() {
        ignite=startServer();
        initTxManager(ignite);
    }

    @Test
    public void doInsertSuccess() {
        IgniteCache<Long,String> cache=ignite.cache("cache");
            txTemplate.execute(new TransactionCallback<Object>() {
                @Override
                public Object doInTransaction(TransactionStatus status) {
                    ignite.cache("cache").put(1l, "My Entity");
                    return null;
                }
            });
        assertEquals("My entity",cache.get(1l));
    }

    public IgniteConfiguration getCongig() {
        IgniteConfiguration iconfig=new IgniteConfiguration();
        iconfig.setLocalHost("localhost");

        CacheConfiguration cacheConfig=new CacheConfiguration();
        cacheConfig.setName("cache");

        iconfig.setCacheConfiguration(cacheConfig);
        return iconfig;
    }

    private void initTxManager(Ignite ignite) {
        txManager=new IgniteSpringTransactionManager(ignite);
        txTemplate=new TransactionTemplate(txManager);
    }

    public Ignite startServer() {
        return Ignition.start(getCongig());
    }

    public Ignite startClient() {
        IgniteConfiguration config=getCongig();
        config.setClientMode(true);
        return Ignition.start(config);
    }
}
