### MrWorkingAPI

API for a field service management system(FSM) targeted at
*ikeja electric*, a power distribution company in Nigeria.

The API currently supports the below functionality:

* Disconnection and Re-connection work orders
* Faults / Faults Work Orders
* Field Service Tracking(GPS)
* Spot Billing etc.

#### Prerequisites

* NPM/NodeJs (Version. 9.2.0)
* MySQL (Version. 5.7.20~)
* Redis (Version. 4.0.2)
* Process Maker Configuration


#### Set Up/Installation

First you'll want to clone this project into your working directory.

`git clone mrworking-api-url`

Next thing you'll want to do is install the dependencies on the
*package.json* file, to do this run the below command.

`npm install`

You'll also need to configure your *.env* file using the format provided
in the *.env.example* file.

1. create a new file with the name *.env*
2. copy the contents on the *.env.example* and paste it on the newly
created *.env* file
3. edit your *.env* file to match your desired set up e.g DB,
process maker etc.


#### Database Migration

1. Ensure you have knex installed
2. run `knex migrate` to create all the tables



#### Authors

* Paul Okeke - Software Developer

See also the list of [contributors](./CONTRIBUTING.md) who participated in this project.