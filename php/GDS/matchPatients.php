<?php

require "Slim/Slim.php";
\Slim\Slim::registerAutoloader();

class Client {
    
    public $id = 0;
    public $firstname = "";
    public $lastname = "";
    public $city = "";
    public $address = "";
    public $postalcode = "";
    public $username = "";
    public $password = "";
    public $dob = "";
    public $signed_in = false;
    public $last_appointment_id = 0;
    
    public function __construct($id, $firstname, $lastname, $dob, $signed_in, $last_appointment_id) {
        $this->id = $id;
        $this->firstname = utf8_encode($firstname);
        $this->lastname = utf8_encode($lastname);
        $this->dob = $dob;
        $this->signed_in = $signed_in;
        $this->last_appointment_id = $last_appointment_id;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "firstname" => $this->firstname,
            "lastname" => $this->lastname,
            "dob" => $this->dob,
            "signed_in" => $this->signed_in,
            "last_appointment_id" => $this->last_appointment_id,
            "message" => "SUCCESS"
        );
    }
}

class LogEntry {

    public $severity;
    public $system;
    public $errorcode;
    public $description;
    public $dt;

    public function __construct($severity, $system, $errorcode, $description) {
        $this->severity = $severity;
        $this->system = $system;
        $this->errorcode = $errorcode;
        $this->description = $description;
    }
}

$app = new \Slim\Slim();

// must define these for Slim
$app->LOG_DEBUG = 0;
$app->LOG_INFO = 1;
$app->LOG_WARNING = 2;
$app->LOG_ERROR = 3;
$app->LOG_CRITICAL = 4;

// LOGLEVEL:
$LOG_DEBUG = 0;
$LOG_INFO = 1;
$LOG_WARNING = 2;
$LOG_ERROR = 3;
$LOG_CRITICAL = 4;

$app->LOGLEVEL = 2;

function query($conn, $sql_query) {

    $result =  $conn->query($sql_query);
    if ($result == FALSE) {
        printf("DB Query Failure %s\n", $conn->error);
        exit();
    }
    
    return $result;
}

function log_msg($app, $conn, $logEntry, $severity) {

    if ($app->LOGLEVEL <= $severity) {
        $result = query($conn, "INSERT INTO Logs (severity,system,errorcode,description,dt) 
            VALUES ('" . $logEntry->severity . "', '" . $logEntry->system . "', " . $logEntry->errorcode . ", '" . $logEntry->description . "', now())");
    }
    return $result;
}


$app->get('/hello/:id', function ($id) {
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

//$app->delete('/hello/:id', function($id) {
$app->delete('/hello/:id', function ($id) use ($app) {    

    include "db.php";

    if (ctype_digit((string)$id)) {
        $conn = new mysqli($servername, $username, $password, $dbname);

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        $result = query($conn,"START TRANSACTION");
        $result = query($conn,"INSERT INTO Del_Clients select * from Clients where id=" . $id);
        $result = query($conn,"DELETE FROM Clients where id=" . $id);
        $affected_rows = $conn->affected_rows;
        $result = query($conn,"COMMIT");
        
        echo $affected_rows;
        
        if ($affected_rows == 0) {
            $app->response()->status(402);
        } else {
            $app->response()->status(200);
        }

        $conn->close();
    } else {
        echo "{error: '$id non numeric'}";
        $app->response()->status(500);
    }
});

$app->post('/hello/', function () use ($app) {

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
    $dob = $conn->real_escape_string((string)$input->dob);

    $dob_year = (int)explode("-", $dob)[0];
    $dob_month = (int)explode("-", $dob)[1];
    $dob_day = (int)explode("-", $dob)[2];

    if (!checkdate($dob_month, $dob_day, $dob_year)) {
        echo "{error: 'Bad date format'}";
        $app->response()->status(404);
    } else {

        $new_result = query($conn, "INSERT INTO Clients (firstname, lastname, dob, username, password) 
                                    values 
                                    ('" . $firstname. "','" . $lastname . "','" . $dob . "','" . $firstname . $lastname . "','none')");
        $cid = $conn->insert_id;
        $app->response()->status(200);    
        $app->response['Content-Type'] = 'application/json';
        
        $c = new Client($cid, $firstname, $lastname, $dob);
        echo json_encode($c->toJSON());
    }    

    } catch (ResourceNotFoundException $e) {
        $app->response()->status(404);
    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }    

    $conn->close();
    
    
});

$app->put('/hello/', function () use ($app) {

    include "db.php";
    
    if (!ctype_digit((string)$id)) {
        echo "{error: '$id non numeric'}";
        $app->response()->status(500);
    }

  try {
      
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    $request = $app->request();
    $body = $request->getBody();
    $input = json_decode($body);

    $id = $conn->real_escape_string((string)$input->id);
    $firstname = $conn->real_escape_string((string)$input->firstname);
    $lastname = $conn->real_escape_string((string)$input->lastname);
    $dob = $conn->real_escape_string((string)$input->dob);

    $dob_year = (int)explode("-", $dob)[0];
    $dob_month = (int)explode("-", $dob)[1];
    $dob_day = (int)explode("-", $dob)[2];

    if (!checkdate($dob_month, $dob_day, $dob_year)) {
        
        echo "{error: 'Bad date format'}";
        $app->response()->status(404);
        
    } else {

        $result = query($conn, "UPDATE Clients SET firstname='" . $firstname . "', lastname='" . $lastname . "', dob='" . $dob . "' where ID=" . $id);
        $app->response()->status(200);

    }    

  } catch (ResourceNotFoundException $e) {
    $app->response()->status(404);
  } catch (Exception $e) {
    $app->response()->status(400);
    $app->response()->header('X-Status-Reason', $e->getMessage());
  }    
    
    $conn->close();
    
});

$app->get('/', function () use ($app) {

    $firstname = utf8_decode(trim($app->request()->params('firstname')));
    $lastname = utf8_decode(trim($app->request()->params('lastname')));
    $dob = $app->request()->params('dob');

    include "db.php";
    
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    $firstname = strtolower($conn->real_escape_string((string)$firstname));
    $lastname = strtolower($conn->real_escape_string((string)$lastname));

    $dob = $conn->real_escape_string((string)$dob);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    if ($dob == '') {
        $result = query($conn, "SELECT ID, firstname, lastname, dob from Clients WHERE lower(firstname)='" . $firstname . "' AND lower(lastname)='" . $lastname . "'");
    } else {
        $result = query($conn, "SELECT ID, firstname, lastname, dob from Clients WHERE lower(firstname)='" . $firstname . "' AND lower(lastname)='" . $lastname . "' and dob='" . $dob . "'");
    }
    
    $clients = [];
    while ($row = $result->fetch_assoc()) {
        
        // is this client signed in at the moment?
        $si_result = query($conn, "SELECT * from Appointments where client_id=" . $row['ID'] . " order by appt_date desc limit 1;");
        $si_row = $si_result->fetch_assoc();
        
        // client is signed in
        if ($si_row['signout_date'] == null) {
            $c = new Client($row['ID'], $row['firstname'], $row['lastname'], $row['dob'], true, $si_row['ID']);
        } else {
            // client is not signed in
            $c = new Client($row['ID'], $row['firstname'], $row['lastname'], $row['dob'], false, 0);
        }
        
        array_push($clients, $c->toJSON());
    }
    
    if (sizeof($clients) == 0) {
        $desc = "Patient not found: [" . $lastname . ", " . $firstname . "].  DoB: " . $dob;
        $le = new LogEntry('WARN','matchPatients.php->get', 404, $desc);
        $result = log_msg($app, $conn, $le, $app->LOG_WARNING);
    }

    $app->response['Content-Type'] = 'application/json';
    $app->response->headers->set('Cache-Control','no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
    $app->response->headers->set('Pragma','no-cache');
    echo json_encode($clients);
    
    $conn->close();

});


$app->run();


?>
