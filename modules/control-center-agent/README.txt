Ignite Control Center Agent
======================================
Ignite Control Center Agent is a java standalone application that allow to connect grid to Ignite Web Control Center.
Control Center Agent communicates with grid nodes via REST interface and connects to Web Control Center via web-socket.

Two main functions of Control Center Agent:
 1. Proxy between Ignite Web Control Center and Ignite Grid to execute SQL statements and collect metrics for monitoring.
 2. Proxy between Ignite Web Control Center and user RDBMS to collect database metadata for later CacheTypeMetadata configuration.


Usage example
======================================

agent.sh -l john.smith@gmail.com -p qwerty -s wss://control-center.gridgain.com

Main command line arguments:
    -l User's login (email) on web-control-center
    -p User's password
    -s Link to Ignite Control Center web-socket server.
    -n Ignite REST server
    -c Configure agent using configuration file. Configuration file is a properties file,
       see /control-center-agent/src/main/resources/config.properties as example.

Ignite Control Center Agent Build Instructions
======================================
    mvn clean package -DskipTests
