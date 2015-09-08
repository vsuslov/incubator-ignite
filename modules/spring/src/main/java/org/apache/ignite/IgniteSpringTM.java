package org.apache.ignite;

import org.apache.ignite.transactions.Transaction;
import org.apache.ignite.transactions.TransactionConcurrency;
import org.apache.ignite.transactions.TransactionIsolation;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.TransactionStatus;

import static org.apache.ignite.transactions.TransactionIsolation.READ_COMMITTED;
import static org.apache.ignite.transactions.TransactionIsolation.REPEATABLE_READ;
import static org.apache.ignite.transactions.TransactionIsolation.SERIALIZABLE;

/**
 * Created by Suslov Vadim on 08/09/2015.
 */
public class IgniteSpringTM implements PlatformTransactionManager,InitializingBean{
    private Ignite ignite;
    //default value
    private TransactionConcurrency concurrency=TransactionConcurrency.PESSIMISTIC;

    public IgniteSpringTM(Ignite ignite) {
        this.ignite = ignite;
        afterPropertiesSet();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void afterPropertiesSet() {
        if(this.ignite==null) {
            throw new IllegalArgumentException("The property \'ignite\' must be set");
        }
    }
    protected Transaction doGetTransaction() {
      return ignite.transactions().tx();
    }

    protected boolean isExists() {
        return doGetTransaction()!=null;
    }
    @Override
    public TransactionStatus getTransaction(TransactionDefinition definition) throws TransactionException {

        return null;
    }

    @Override
    public void commit(TransactionStatus status) throws TransactionException {



    }

    @Override
    public void rollback(TransactionStatus status) throws TransactionException {

    }

    /**
     * Creates a default Ignite transaction
     * @return transaction
     */
    protected Transaction createTransaction() {
        return ignite.transactions().txStart();
    }

    /**
     * Creates and Ignite Transaction
     * @param definition
     *          information about transaction
     * @return
     *      transaction
     */
    protected Transaction createTransaction(TransactionDefinition definition) {
        Transaction result=null;
        if(definition!=null) {
            TransactionIsolation isolation = convertIsolation(definition.getIsolationLevel());
            if(isolation==null) {
                result=createTransaction();
            } else {
                long timeout=definition.getTimeout();
                if(timeout>0) {
                    result=ignite.transactions().txStart(concurrency,isolation,timeout,0);
                } else {
                    result = ignite.transactions().txStart(concurrency, isolation);
                }
            }
        }
        return result;
    }

    /**
     * Converts Spring isolation level
     * to Ignite isolation level
     * @param springIsolation
     * @return
     */
    protected TransactionIsolation convertIsolation(int springIsolation) {
        return  springIsolation==2?READ_COMMITTED:
                springIsolation==4?REPEATABLE_READ:
                        springIsolation==8?SERIALIZABLE:null;
    }

    ///////////////////////////////////getters/setters////////////////////////////
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
