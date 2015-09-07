package org.apache.ignite;

import org.apache.ignite.resources.LoggerResource;
import org.apache.ignite.transactions.Transaction;
import org.apache.ignite.transactions.TransactionConcurrency;
import org.apache.ignite.transactions.TransactionIsolation;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.transaction.*;
import org.springframework.transaction.support.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import static org.apache.ignite.transactions.TransactionConcurrency.*;
import static org.springframework.transaction.TransactionDefinition.*;
import static org.apache.ignite.transactions.TransactionIsolation.*;
/**
 * Created by Suslov Vadim on 24/08/2015.
 */
public class IgniteSpringTransactionManager2 extends AbstractPlatformTransactionManager implements CallbackPreferringPlatformTransactionManager,InitializingBean {
    protected Ignite ignite;
    protected Map<Long,Object> results;
    protected TransactionConcurrency concurrency=PESSIMISTIC;
    /** Grid logger. */
    @LoggerResource
    private IgniteLogger log;

    public IgniteSpringTransactionManager2(Ignite ignite) {
        this();
        this.ignite = ignite;
        afterPropertiesSet();
    }

    public IgniteSpringTransactionManager2() {
        results=new ConcurrentHashMap<>();
    }

    @Override
    public void afterPropertiesSet() {
        if(this.getIgnite()==null) {
            throw new IllegalArgumentException("Property \'ignite\' is required");
        }
    }

    @Override
    public <T> T execute(TransactionDefinition definition, TransactionCallback<T> callback) throws TransactionException {
        Object transaction=doGetTransaction();
        if(definition==null) {
            definition=new DefaultTransactionDefinition();
        }

        if (definition.getTimeout() < TransactionDefinition.TIMEOUT_DEFAULT) {
            throw new InvalidTimeoutException("Invalid transaction timeout", definition.getTimeout());
        }

        int propagation=definition.getPropagationBehavior();
        T result=null;
        DefaultTransactionStatus status=null;
        boolean debug=log.isDebugEnabled();
        try {
            if(!isExistingTransaction(transaction)) {
                if (propagation == TransactionDefinition.PROPAGATION_MANDATORY) {
                    throw new IllegalTransactionStateException(
                            "Transaction propagation 'mandatory' but no existing transaction found");
                }
                if (propagation == TransactionDefinition.PROPAGATION_SUPPORTS ||
                        propagation == TransactionDefinition.PROPAGATION_NOT_SUPPORTED || propagation == TransactionDefinition.PROPAGATION_NEVER) {
                    //do without tx;
                    status = new DefaultTransactionStatus(null, false, false, false, debug, null);
                    prepareSynchronization(status,definition);
                    result = callback.doInTransaction(status);
                } else {
                    // create new tx and do callback action
                    createDefaultTx();
                    status = new DefaultTransactionStatus(doGetTransaction(), true, true, definition.isReadOnly(), debug, null);
                    prepareSynchronization(status,definition);
                    result = callback.doInTransaction(status);
                }
            } else {

            }
            commit(status);
        }catch(IgniteException ie) {
            rollback(status);
            result=null;
            throw new TransactionSystemException("Could not execute Ignite transaction");
        }



        return result;
    }

    @Override
    protected Object doGetTransaction() throws TransactionException {
        return getIgnite().transactions().tx();
    }

    @Override
    protected void doBegin(Object transaction, TransactionDefinition definition) throws TransactionException {

    }

    @Override
    protected void doCommit(DefaultTransactionStatus status) throws TransactionException {
        Transaction transaction=(Transaction) status.getTransaction();
        transaction.commit();
    }

    @Override
    protected void doRollback(DefaultTransactionStatus status) throws TransactionException {
        Transaction transaction=(Transaction) status.getTransaction();
        transaction.rollback();
    }

    @Override
    protected boolean isExistingTransaction(Object transaction) throws TransactionException {
        return transaction!=null;
    }

    protected Transaction createDefaultTx() {
        return getIgnite().transactions().txStart();
    }


    protected Transaction createTx(int isolation, long timeOut) {
        TransactionIsolation igniteIsolation=convertIsolation(isolation);
        if(igniteIsolation==null) {
            return createDefaultTx();
        }
        timeOut=timeOut>0?timeOut:0;
        return getIgnite().transactions().txStart(concurrency,igniteIsolation,timeOut,0);
    }

    protected TransactionIsolation convertIsolation(int isolation) {
        TransactionIsolation result=null;
        switch(isolation) {
            case ISOLATION_REPEATABLE_READ:result=REPEATABLE_READ;
                break;
            case ISOLATION_READ_COMMITTED:result=READ_COMMITTED;
                break;
            case ISOLATION_SERIALIZABLE:result=SERIALIZABLE;
                break;
            default:result=null;
        }
        return result;
    }

    public Ignite getIgnite() {
        return ignite;
    }

    public void setIgnite(Ignite ignite) {
        this.ignite = ignite;
    }

    public TransactionConcurrency getConcurrency() {
        return concurrency;
    }

    public void setConcurrency(TransactionConcurrency concurrency) {
        this.concurrency = concurrency;
    }
}
