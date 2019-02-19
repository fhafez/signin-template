<?php

require "Slim/Slim.php";
\Slim\Slim::registerAutoloader();

class Staff {
    
    public $id = 0;
    public $firstname = "";
    public $lastname = "";
    
    public function __construct($id, $firstname, $lastname) {
        $this->id = $id;
        $this->firstname = utf8_encode($firstname);
        $this->lastname = utf8_encode($lastname);
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "firstname" => $this->firstname,
            "lastname" => $this->lastname,
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

$app->get('/(:cid)', function ($cid=-1) use ($app) {
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    if ($cid == -1) {
        $result = query($conn, "SELECT * FROM Staff ORDER BY ID");

    } else {
        $result = query($conn, "SELECT * FROM Staff WHERE ID=" . $cid);

    }
    
    $staff = [];
    
    while ($row = $result->fetch_assoc()) {
        $s = new Staff($row['ID'], $row['firstname'], $row['lastname']);
        array_push($staff, $s->toJSON());
    }    
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($staff);

    $conn->close();

});


$app->run();

?>
