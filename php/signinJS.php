<?php

require "Slim/Slim.php";
\Slim\Slim::registerAutoloader();

class Appointment {
    
    public $id = 0;
    public $client_id = 0;
    public $staff_id = 0;
    public $signin_date = "";
    public $signout_date = "";
    public $signature = "";
    public $signature_filename = "";
    
    public function __construct($id, $client_id, $signin_date, $signout_date, $signature, $signature_filename) {
        $this->id = $id;
        $this->client_id = $client_id;
        $this->signin_date = $signin_date;
        $this->signout_date = $signout_date;
        $this->signature = $signature;
        $this->signature_filename = $signature_filename;        
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "client_id" => $this->client_id,
            "signin_date" => $this->signin_date,
            "signout_date" => $this->signout_date,
            "signature" => $this->signature,
            "signature_filename" => $this->signature_filename,            
            "message" => "SUCCESS"
        );
    }
}

class Appointment_MSG {
    
    public $id = 0;
    public $client_id = 0;
    public $dob = "";
    public $firstname = "";
    public $lastname = "";
    public $services = [];
    public $signature = "";
    public $signed_in = false;
    
    public function __construct($id, $client_id, $dob, $firstname, $lastname, $services, $signed_in, $signature) {
        $this->id = $id;
        $this->client_id = $client_id;
        $this->dob = $dob;
        $this->firstname = $firstname;
        $this->lastname = $lastname;
        $this->services = $services;
        $this->signed_in = $signed_in;        
        $this->signature = $signature;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "client_id" => $this->client_id,
            "dob" => $this->dob,
            "firstname" => $this->firstname,
            "lastname" => $this->lastname,
            "services" => $this->services,
            "signed_in" => $this->signed_in,
            "signature" => $this->signature,
            "message" => "SUCCESS"
        );
    }
}

class Available_Appointments {
    
    public $id = 0;
    public $service_id = 0;
    public $service_name = 0;
    public $provider_id = 0;
    public $provider_name = 0;
    public $remaining_appts = "";
    public $expires_on = "";
    public $active_on = "";
    public $active_now = "";
    public $mva = "";
    
    public function __construct($id, $service_id, $service_name, $provider_id, $provider_name, $remaining_appts, $expires_on, $active_on, $active_now, $mva) {
        $this->id = $id;
        $this->service_id = $service_id;
        $this->service_name = $service_name;
        $this->provider_id = $provider_id;
        $this->provider_name = $provider_name;
        $this->remaining_appts = $remaining_appts;
        $this->expires_on = $expires_on;
        $this->active_on = $active_on;
        $this->active_now = $active_now;
        $this->mva = $mva;        
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "service_id" => $this->service_id,
            "service_name" => $this->service_name,
            "provider_id" => $this->provider_id,
            "provider_name" => $this->provider_name,
            "remaining_appts" => $this->remaining_appts,
            "expires_on" => $this->expires_on,
            "active_on" => $this->active_on,
            "active_now" => $this->active_now,
            "mva" => $this->mva,
            "message" => "SUCCESS"
        );
    }
}



class Available_Appointments_Per_Client {
    
    public $id = 0;
    public $service_id = 0;
    public $service_name = 0;
    public $provider_id = 0;
    public $provider_name = 0;
    public $remaining_appts = "";
    public $expires_on = "";
    public $active_on = "";
    public $active_now = "";
    public $mva = "";
    
    public function __construct($id, $client_id, $service_id, $service_name, $provider_id, $provider_name, $remaining_appts, $expires_on, $active_on, $active_now, $mva) {
        $this->id = $id;
        $this->client_id = $client_id;
        $this->service_id = $service_id;
        $this->service_name = $service_name;
        $this->provider_id = $provider_id;
        $this->provider_name = $provider_name;
        $this->remaining_appts = $remaining_appts;
        $this->expires_on = $expires_on;
        $this->active_on = $active_on;
        $this->active_now = $active_now;
        $this->mva = $mva;        
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "client_id" => $this->client_id,
            "service_id" => $this->service_id,
            "service_name" => $this->service_name,
            "provider_id" => $this->provider_id,
            "provider_name" => $this->provider_name,
            "remaining_appts" => $this->remaining_appts,
            "expires_on" => $this->expires_on,
            "active_on" => $this->active_on,
            "active_now" => $this->active_now,
            "mva" => $this->mva,
            "message" => "SUCCESS"
        );
    }
}

class SignoutAppointment {
    
    public $id = 0;
    public $client_id = 0;
    public $end_datetime = "";
    
    public function __construct($id, $client_id, $end_datetime) {
        $this->id = $id;
        $this->client_id = $client_id;
        $this->end_datetime = $end_datetime;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "client_id" => $this->client_id,
            "end_datetime" => $this->end_datetime,
            "message" => "SUCCESS"
        );
    }
    
}

function query($conn, $sql_query) {

    $result =  $conn->query($sql_query);
    if ($result == FALSE) {
        printf("DB Query Failure %s\n", $conn->error);
        exit();
    }
    
    return $result;
}

$app = new \Slim\Slim();

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

$app->post('/', function () use ($app) {

    date_default_timezone_set('America/Toronto');
    $date = date_create();
    
    $service_unspecified_id = '7';
    $plan_unspecified_id = '5';    
    include "db.php";
    
    try {

        $conn = new mysqli($servername, $username, $password, $dbname);
        if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        $request = $app->request();
        $body = $request->getBody();
        $input = json_decode($body);

        $firstname = $conn->real_escape_string((string)$input->firstname);
        $lastname = $conn->real_escape_string((string)$input->lastname);
        $client_id = $conn->real_escape_string((string)$input->client_id);
        $current_datetime = (string)$input->current_datetime;
        $sig = $conn->real_escape_string((string)$input->sig);
        
        $services = $input->services;
        //var_dump($services);
        
        $result = query($conn, "START TRANSACTION");
        
        $signature = base64_decode(str_replace("image/svg+xml;base64,","",$sig));
        $sig_filename_wo_slashes = stripcslashes($firstname) . "_" . stripcslashes($lastname) . "_" . strval(date_timestamp_get($date)) . ".svg";
        $sig_filename_w_slashes = $firstname . "_" . $lastname . "_" . strval(date_timestamp_get($date)) . ".svg";
        //file_put_contents("../clinic_signin/signatures/$sig_filename",$signature);
        file_put_contents("../signatures/$sig_filename_wo_slashes",$signature);

        $tz_result = query($conn, "SET time_zone='America/Toronto'");
        $new_result = query($conn, "INSERT INTO Appointments (client_id, appt_date, sig_filename) 
                                    values 
                                    ('" . $client_id. "','" . $current_datetime . "','" . $sig_filename_w_slashes . "')");
        if ($conn->errno > 0) {
            echo "Error: " + $conn->errno;
            $app->response()->status(402);
            $conn->close();
            return;
        }
        
        $aid = $conn->insert_id;

        // if any services were selected by the patient then process those
        if ($services) {
            
            // decrement all the services that are not unlimited
            foreach ($services as $service) {
                $service_id = $service->service_id;

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
        
        $result = query($conn, "COMMIT");
        
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
        
        $app->response()->status(200);
        $app->response['Content-Type'] = 'application/json';

        
        $c = new Appointment($aid, $client_id, "", "", "", "");
        echo json_encode($c->toJSON());
        //echo json_encode($available_appointments);


    } catch (ResourceNotFoundException $e) {
        $app->response()->status(404);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }    

    $conn->close();
    
    
});

/*
  return todays' appointments
  used for offline work
*/
$app->get('/appointments/', function () use ($app) {
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    $tz = new DateTimeZone("America/New_York");
    $today = new DateTime();
    $today->setTimezone($tz);

    $tod = $today->format("Y-m-d");
    $result = query($conn, "SELECT aa.ID, aa.client_id, c.firstname, c.lastname, c.dob from Appointments aa, Clients c WHERE aa.client_id = c.id and aa.appt_date > '" . $tod . "'");
    
    $appointments = [];
    while ($row = $result->fetch_assoc()) {
        $c = new Appointment_MSG($row['ID'], $row['client_id'], $row['dob'], $row['firstname'], $row['lastname'], [], true, "");
        array_push($appointments, $c->toJSON());
    }
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($appointments);
    
    $conn->close();

});

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

$app->get('/details/', function () use ($app) {

    $client_id = $app->request()->params('cid');
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    $available_appointments = [];

    // return an array of all clients and each client's available appointment
    if ($client_id == "") {

        $result = query($conn, "
            select aa.client_id, aa.ID, s.id as service_id, name, p.id as provider_id, provider, remaining_appts, expires_on, active_on, active_now, mva 
            from Available_Appts aa, Services s, Plans p where
            aa.service_id = s.id and 
            aa.plan_id = p.ID
            order by aa.client_id;
        ");
        
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $aa = new Available_Appointments_Per_Client(
                    $row["ID"],
                    $row["client_id"],
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

    } else {
    // return a single client's available appointments
        $result = query($conn, "
            select aa.ID, s.id as service_id, name, p.id as provider_id, provider, remaining_appts, expires_on, active_on, active_now, mva 
            from Available_Appts aa, Services s, Plans p where
            aa.client_id = " . $client_id . " and
            aa.service_id = s.id and 
            aa.plan_id = p.ID;
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

    }
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($available_appointments);
    
    $conn->close();

});

$app->put('/details/:id', function () use ($app) {
    
    $app->response['Content-Type'] = 'application/json';
    echo "{}";
    
});

// signout
//  ($id, $client_id, $start_datetime, $end_datetime, $signature_filename) {

$app->put('/:aid', function ($aid) use ($app) {
 
    $request = $app->request();
    $body = $request->getBody();
    $input = json_decode($body);
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);
 
    $end_datetime = $conn->real_escape_string((string)$input->signout_date);
    $client_id = $conn->real_escape_string((string)$input->client_id);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    try {

        $result = query($conn, "UPDATE Appointments SET signout_date='" . $end_datetime . "' where ID=" . $aid);
    
    } catch (Exception $e) {
        $app->response()->status(500);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }

    $a = new SignoutAppointment($aid, $client_id, $end_datetime);

    $app->response()->status(200);
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($a->toJSON());

    $conn->close();

});

$app->run();







?>
