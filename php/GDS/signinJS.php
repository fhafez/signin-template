<?php
require 'vendor/autoload.php';
require 'Slim/Slim.php';
require 'models.php';
\Slim\Slim::registerAutoloader();

use Google\Cloud\Datastore\DatastoreClient;

$app = new \Slim\Slim();

/*
$app->get('/:id', function ($id) {
    //echo "you requested id $id"; 
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    $result = query($conn, "SELECT ID, firstname, lastname, dob from Clients where ID=$id;");

    $row = $result->fetch_assoc();
    $c = new Client($row['ID'], $row['firstname'], $row['lastname'], $row['dob']);
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($c->toJSON());

    $conn->close();
    
});
*/

/*
  purpose: to add a new appointment
*/
$app->post('/', function () use ($app) {

    date_default_timezone_set('America/Toronto');
    
    $service_unspecified_id = '7';
    $plan_unspecified_id = '5';    
    
    try {

        $request = $app->request();
        $body = $request->getBody();
        $input = json_decode($body);

        if (!isset($input->firstname) || !isset($input->lastname) || !isset($input->patientID) || !isset($input->signature)) {
            throw new Exception("one of the mandatory parameters missing");
        }

        $firstname = trim((string)$input->firstname);
        $lastname = trim((string)$input->lastname);
        $patientID = (string)$input->patientID;
        $signature = (string)$input->signature;
        $services = $input->services;
        
        //$signature = base64_decode(str_replace("image/svg+xml;base64,","",$signature));
        
        $appointment = new Appointment(new DateTime(), NULL, $signature);

        $appointmentResult = $appointment->save($patientID);

        // if any services were selected by the patient then process those
        /*
        if ($services) {
            
            // decrement all the services that are not unlimited
            foreach ($services as $service) {
                $service_id = $service->id;

                // GET the Provider ID
                $provider_name = $service->provider_name;
                $provider_id = $service->provider_id;

                $result = query($conn, "UPDATE Available_Appts SET remaining_appts=remaining_appts-1 WHERE ID=" . $service_id);

                // Insert a new record in Appointment_Services table with all the services selected
                $result = query($conn, "INSERT INTO Appointment_Services (appointment_id, service_id, plan_id) values (" . $aid . ", " . $service_id . ", " . $provider_id . ")");
            }
            
        } else {

            $result = query($conn, "INSERT INTO Appointment_Services (appointment_id, service_id, plan_id) values (" . $aid . ", " . $service_unspecified_id . ", " . $plan_unspecified_id . ")");
            
        }
                
        // retrieve all the services for this patient from the DB and return them in the response
        $result = query($conn, "SELECT aa.id, s.name as service_name, p.provider, aa.remaining_appts, aa.expires_on FROM
                                Available_Appts aa, Services s, Plans p
                                WHERE
                                aa.client_id = " . $client_id . " AND 
                                aa.service_id = s.id AND aa.plan_id = p.id
                                AND active_now = true AND (expires_on > now() OR expires_on is NULL)");
        
        if ($conn->errno > 0) {
            echo "Error: " + $conn->errno;
            $app->response()->status(402);
            $conn->close();
            return;
        }
        
        $available_appointments = [];
        while ($row = $result->fetch_assoc()) {
            $aa = new Available_Appointments(
                $row["id"],
                "",
                $row["service_name"],
                "",
                $row["provider"],
                $row["remaining_appts"],
                $row["expires_on"],
                "",
                "",
                ""
            );
            array_push($available_appointments, $aa->toJSON());
        }
        
        */
        $app->response()->status(200);
        $app->response['Content-Type'] = 'application/json';
        echo("{'appointmentID' : " . $appointmentResult->key()->pathEnd()['id'] . "}");
        //echo json_encode($appointmentResult);        

    } catch (ResourceNotFoundException $e) {
        $app->response()->status(404);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }    
    
});

/*
  purpose: 
*/
/*
$app->get('/', function () use ($app) {

    $firstname = utf8_decode($app->request()->params('firstname'));
    $lastname = utf8_decode($app->request()->params('lastname'));
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    $result = query($conn, "SELECT ID, firstname, lastname, dob from Clients WHERE firstname='" . $firstname . "' AND lastname='" . $lastname . "'");
    
    $clients = [];
    while ($row = $result->fetch_assoc()) {
        $c = new Client($row['ID'], $row['firstname'], $row['lastname'], $row['dob']);
        array_push($clients, $c->toJSON());
    }
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($clients);
    
    $conn->close();

});
*/

/*
  purpose: used to return the number of appointments remaining for a patient
*/
$app->get('/details/', function () use ($app) {

    $client_id = $app->request()->params('cid');
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    $result = query($conn, "
        select aa.ID, s.id as service_id, name, p.id as provider_id, provider, remaining_appts, expires_on, active_on, active_now, mva 
        from Available_Appts aa, Services s, Plans p where
        aa.client_id = " . $client_id . " and
        aa.service_id = s.id and 
        aa.plan_id = p.ID and
        active_on <= now();
    ");

    $available_appointments = [];
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $aa = new Available_Appointments(
                $row["ID"],
                $row["service_id"],
                $row["name"],
                $row["provider_id"],
                $row["provider"],
                $row["remaining_appts"],
                $row["expires_on"],
                $row["active_on"],
                $row["active_now"],
                $row["mva"]
                );
            array_push($available_appointments, $aa->toJSON());
        }
    }
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($available_appointments);
    
    $conn->close();

});

/*
$app->put('/details/:id', function () use ($app) {
    
    $app->response['Content-Type'] = 'application/json';
    echo "{}";
    
});
*/

/*
  purpose: used for signing out appointments
*/
$app->put('/', function () use ($app) {
    
    $id = $app->request()->params('appointment_id');
    $signout_date = $app->request()->params('signout_date');
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    $result = query($conn, "UPDATE Appointments SET signout_date='" . $signout_date . "' WHERE ID=" . $id);

    $app->response['Content-Type'] = 'application/json';
    echo json_encode($clients);
    
    $conn->close();

    
});

$app->run();







?>
