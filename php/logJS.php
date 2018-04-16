<?php

require "Slim/Slim.php";
\Slim\Slim::registerAutoloader();

class LogEntry {
    
    public $system = "";
    public $severity = "";
    public $message = "";
    public $errorcode = "";
    public $datetime = "";
    
    public function __construct($system, $severity, $message, $errorcode, $datetime) {
        $this->system = $system;
        $this->severity = $severity;
        $this->message = $message;
        $this->errorcode = $errorcode;
        $this->datetime = $datetime;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "system" => $this->system,
            "message" => $this->message,
            "errorcode" => $this->errorcode,
            "datetime" => $this->datetime,
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

$app->get('/(:lastlines)', function ($lastlines=100) use ($app) {
    
    include "db.php";

    $lastlines = $app->request()->params('lastlines');
    if (!is_numeric($lastlines)) {
        $lastlines = 100;
    }
 
    try {

        $conn = new mysqli($servername, $username, $password, $dbname);

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        $result = query($conn, "SELECT ID, system, severity, description, errorcode, dt FROM Logs ORDER BY ID DESC LIMIT " . $lastlines);

        $row = $result->fetch_assoc();
        
        $logEntries = [];

        while ($row = $result->fetch_assoc()) {
            $l = new LogEntry($row['ID'], $row['system'], $row['severity'], $row['description'], $row['errorcode'], $row['dt']);
            array_push($logEntries, $l->toJSON());
        }    

        
        $app->response['Content-Type'] = 'application/json';
        echo json_encode($logEntries);

    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }

    $conn->close();
    
});

$app->post('/', function () use ($app) {

    include "db.php";

    $request = $app->request();
    $body = $request->getBody();
    $input = json_decode($body);

    $conn = mysqli_connect($servername, $username, $password, $dbname);

    $datetime = $conn->real_escape_string((string)$input->datetime);
    $errorcode = $conn->real_escape_string((string)$input->errorcode);
    $message = $conn->real_escape_string((string)$input->message);
    $severity = $conn->real_escape_string((string)$input->severity);
    $system = $conn->real_escape_string((string)$input->system);

    try {

        $message = str_replace("\$","\\$", $message);

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }


        $stmt = mysqli_prepare($conn, "INSERT INTO Logs (system, severity, description, errorcode, dt) VALUES (?, ?, ?, ?, ?)");
        mysqli_stmt_bind_param($stmt, "sssis", $system, $severity, $message, $errorcode, $datetime);
        mysqli_stmt_execute($stmt);

        //$result = query($conn, " ('" . $system . "'', '" . $severity . "', '" . $message . "', " . $errorcode . ", '" . $datetime . "')");
        
        $app->response['Content-Type'] = 'application/json';
        $app->response()->status(200);        
        echo "";

    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }

    $conn->close();

});

$app->run();


?>
