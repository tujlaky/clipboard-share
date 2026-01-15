#!/bin/bash

MY_IP=`ifconfig en0 | grep "inet " | awk '{print $2}'`

if [ "$HTTPS" = "true" ]; then
  URL="https://${MY_IP}:3000"
else
  URL="http://${MY_IP}:3000"
fi

url_to_qr.py $URL

