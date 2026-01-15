#!/bin/bash

# Script to generate local SSL certificates using mkcert
# First-time setup: brew install mkcert && mkcert -install

CERT_DIR="./certs"

# Create certs directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Get local IP address for including in the certificate
MY_IP=$(ifconfig en0 | grep "inet " | awk '{print $2}')

echo "Generating certificates for localhost and $MY_IP..."

# Generate certificates for localhost, 127.0.0.1, and local IP
mkcert -key-file "$CERT_DIR/key.pem" -cert-file "$CERT_DIR/cert.pem" localhost 127.0.0.1 ::1 "$MY_IP"

echo "Certificates generated in $CERT_DIR/"
echo "  - $CERT_DIR/cert.pem"
echo "  - $CERT_DIR/key.pem"
