Apache Ignite Control Center Agent
---------------------------
Apache Ignite Control Center Agent is a java standalone application that allow to connect grid to control center.
Control Center Agent communicates with grid nodes via REST interface and connects to Control Center via web-socket.

---------------------------
Usage example:
agent.sh -l ivan.ivanov@gmail.com -p qwerty -s wss://control-center.gridgain.com

Command line arguments:
    -l User's login (email) on web-control-center
    -p User's password
    -s Link to Ignite Control Center web-socket server.
    -n Ignite REST server
    -c Configure agent using configuration file. Configuration file is a properties file,
       see /control-center-agent/src/main/resources/config.properties as example.

---------------------------
Building module:
to build module run "mvn package"