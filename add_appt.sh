#!/bin/bash

if [ $# -lt 4 ]; then
	echo ""
	echo ""
	echo "USAGE: add_appt.sh LASTNAME FIRSTNAME SIGNIN_DATE SIGNOUT_DATE HOST DB"
	echo "date format: YYYY-MM-DD HH:MM:SS"
	echo ""
	echo "example:"
	echo "    add_appt.sh hafez fadi \"2016-01-01 11:23:00\" \"2016-01-01 12:20:00\" parcontario.com parconta_scar_physiotherapy"
	echo ""

	exit -1
fi

firstname=$2
lastname=$1
signin_date=$3
signout_date=$4
host=$5
db=$6

if [ $host ]; then
	host="--host $host"
else
	host=""
fi

echo "WORKING ON $host in $db"
echo "Adding $firstname $lastname to sign in at $signin_date and signout at $signout_date"

#results=`mysql $host parconta_scar_physiotherapy -u parconta_root -prigardo88 -e "select id from Clients where firstname='$firstname' and lastname='$lastname'"`

results=`mysql $host $db -u parconta_root -prigardo88 -e "select id from Clients where firstname='$firstname' and lastname='$lastname'"`
echo $results;

if [ `echo $results | wc -w` -gt 2 ]; then
	echo "Multiple clients match that first and last name";
	exit 5;
fi

clientid=`echo $results | cut -d ' ' -f 2`

if [ ! $clientid ]; then
	echo "No client by that name found"
	echo ""
	exit 10;
fi

echo "client id is $clientid"

results=`mysql $host parconta_scar_physiotherapy -u parconta_root -prigardo88 -e "select sig_filename from Appointments where client_id=$clientid limit 1"`
#echo $results

sigfilename=`echo $results | cut -d ' ' -f 2`

if [ ! $sigfilename ]; then
	echo "Client has no past sign ins"
	echo ""
	exit 15;
fi

echo $sigfilename

insert_result=`mysql $host parconta_scar_physiotherapy -u parconta_root -prigardo88 -e "insert into Appointments (client_id, appt_date, signout_date, sig_filename) values ($clientid,'$signin_date','$signout_date','$sigfilename')"`
echo $insert_result
