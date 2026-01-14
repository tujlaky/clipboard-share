#!/bin/bash

MY_IP=`ifconfig en0 | grep "inet " | awk '{print $2}'`
URL="http://${MY_IP}:3000"

url_to_qr.py $URL

