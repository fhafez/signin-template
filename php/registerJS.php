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
    
    public function __construct($id, $firstname, $lastname, $dob) {
        $this->id = $id;
        $this->firstname = $firstname;
        $this->lastname = $lastname;
        $this->dob = $dob;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "firstname" => $this->firstname,
            "lastname" => $this->lastname,
            "dob" => $this->dob,
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

$app->post('/', function () use ($app) {

    date_default_timezone_set('America/Toronto');
    
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

        $result =  query($conn, "select id from Clients where firstname='" . $firstname . "' and lastname='" . $lastname . "' and dob = '" . $dob . "'");
    
        if ($result->num_rows > 0) {
            echo "{\"Error\": \"A patient with that Name and Date of Birth already exists.\"}";
            $app->response()->status(403);
            $conn->close();
            return;
        }

        $new_result = query($conn, "INSERT INTO Clients (firstname, lastname, dob, username, password) 
                                    values 
                                    ('" . $firstname. "', '" . $lastname . "','" . $dob . "', '" . $firstname . $lastname . "', '" . $firstname . $lastname . "')");
        if ($conn->errno > 0) {
            echo "Error: " + $conn->errno;
            $app->response()->status(402);
            $conn->close();
            return;
        }
        
        $cid = $conn->insert_id;

        $app->response()->status(200);
        $app->response['Content-Type'] = 'application/json';

        
        $c = new Client($cid, $firstname, $lastname, $dob);
        echo json_encode($c->toJSON());

    } catch (ResourceNotFoundException $e) {
        $app->response()->status(404);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }    

    $conn->close();
    
    
});


$app->run();
