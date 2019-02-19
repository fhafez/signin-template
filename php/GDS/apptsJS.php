<?php

require "Slim/Slim.php";
\Slim\Slim::registerAutoloader();

class SimpleAppointment {
    
    public $id = 0;
    public $client_id = 0;
    public $staff_id = 0;       // unused
    public $start_datetime = "";
    public $end_datetime = "";
    public $signature_filename = "";
    
    public function __construct($id, $client_id, $start_datetime, $end_datetime, $signature_filename) {
        $this->id = $id;
        $this->client_id = $client_id;
        $this->start_datetime = $start_datetime;
        $this->end_datetime = $end_datetime;
        $this->signature_filename = $signature_filename;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "client_id" => $this->client_id,
            "start_datetime" => $this->start_datetime,
            "end_datetime" => $this->end_datetime,
            "signature_filename" => $this->signature_filename,
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


$app->get('/signin/', function () use ($app) {
        
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    $aid = $app->request()->params('id');

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    $result = query($conn, "SELECT * FROM Appointments WHERE ID=" . $aid);
    
    $appointments = [];
    
    $row = $result->fetch_assoc();
    $a = new SimpleAppointment($row['ID'], $row['client_id'], $row['appt_date'], $row['signout_date'], "");
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($a->toJSON());

    $conn->close();

});

$app->put('/signin/:aid', function ($aid=-1) use ($app) {
 
    $request = $app->request();
    $body = $request->getBody();
    $input = json_decode($body);
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);
 
    $end_datetime = $conn->real_escape_string((string)$input->end_datetime);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    $result = query($conn, "UPDATE Appointments SET signout_date='" . $end_datetime . "' where ID=" . $aid);
    
    if ($conn->affected_rows == 1) {
        $app->response()->status(200);
    } else {
        $app->response()->status(500);
    }

    $a = new SimpleAppointment($aid, "", "", $end_datetime, "");

    $app->response['Content-Type'] = 'application/json';
    echo json_encode($a->toJSON());

    $conn->close();

});


$app->run();

?>
