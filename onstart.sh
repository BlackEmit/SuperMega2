#!/bin/bash
# This file is run on instance start. Output in /var/log/onstart.log
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - &&
sudo apt-get install -y nodejs
sudo apt-get install -y npm

rm -rf /root/SuperMega2/
git clone https://github.com/Sheryna1/SuperMega2.git
cd /root/SuperMega2/ 

sh ./script.sh
