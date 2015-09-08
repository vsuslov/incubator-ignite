package org.apache.ignite;

import org.apache.ignite.transactions.Transaction;
import org.apache.ignite.transactions.TransactionConcurrency;
import org.apache.ignite.transactions.TransactionIsolation;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.apache.ignite.transactions.TransactionIsolation.*;

/**
 * The Simple Transaction Manager,
 * It doesn't support Requires_new transactions
 * from an existing one. It's because Ignite
 * binds its transaction to current execution thread
 *
 * Created by Suslov Vadim rs.vsuslov@gmail.com on 28/08/2015.
 */
public class IgniteSpringTransactionManager extends AbstractPlatformTransactionManager implements InitializingBean{

    private Ignite ignite;
    //default value
    private TransactionConcurrency concurrency=TransactionConcurrency.PESSIMISTIC;

    public IgniteSpringTransactionManager(Ignite ignite) {
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


    /**
     * {@inheritDoc}
     */
    @Override
    protected Object doGetTransaction() throws TransactionException {
        IgniteTxObject txObject=new IgniteTxObject();
        Transaction tx=(Transaction) TransactionSynchronizationManager.getResource(ignite);
        txObject.setTransaction(tx);
        return txObject;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected boolean isExistingTransaction(Object transaction) throws TransactionException {
        IgniteTxObject txObject=(IgniteTxObject) transaction;
        return txObject.getTransaction()!=null;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void doBegin(Object transaction, TransactionDefinition definition) throws TransactionException {
        IgniteTxObject txObject=(IgniteTxObject) transaction;
        if(!isExistingTransaction(transaction)) {
            Transaction tx=createTransaction(definition);
            txObject.setTransaction(tx);
            TransactionSynchronizationManager.bindResource(ignite, tx);
        } else throw new CannotCreateTransactionException("Ignite supports only one transaction per thread");
        //else do not create a transaction, just join a current one
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void doCommit(DefaultTransactionStatus status) throws TransactionException {
        IgniteTxObject txObject=(IgniteTxObject) status.getTransaction();
        Transaction transaction= txObject.getTransaction();
        try {
            transaction.commit();
        } catch(IgniteException ie) {
            throw new TransactionSystemException("Couldn't commit Ignite transaction");
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void doRollback(DefaultTransactionStatus status) throws TransactionException {
        IgniteTxObject txObject=(IgniteTxObject) status.getTransaction();
        Transaction tx=txObject.getTransaction();

        try {
            ignite.transactions().tx().rollback();
        } catch(IgniteException ie) {
            throw new TransactionSystemException("Couldn't rollback Ignite transaction");
        }
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

    class IgniteTxObject {
        private Transaction transaction;

        public Transaction getTransaction() {
            return transaction;
        }

        public void setTransaction(Transaction transaction) {
            this.transaction = transaction;
        }
    }
}
