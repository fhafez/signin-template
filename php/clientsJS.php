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
    
    public function __construct($id, $firstname, $lastname, $dob, $address, $city, $postalcode) {
        $this->id = $id;
        $this->firstname = utf8_encode($firstname);
        $this->lastname = utf8_encode($lastname);
        $this->dob = $dob;
        $this->address = $address;
        $this->city = $city;
        $this->postalcode = $postalcode;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "firstname" => $this->firstname,
            "lastname" => $this->lastname,
            "dob" => $this->dob,
            "address" => $this->address,
            "city" => $this->city,
            "postalcode" => $this->postalcode,
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
    $c = new Client($row['ID'], $row['firstname'], $row['lastname'], $row['dob'], '', '', '');
    
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
        
        $c = new Client($cid, $firstname, $lastname, $dob, '', '', '');
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

$app->put('/hello/:id', function ($id) use ($app) {

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
    $firstname = $conn->real_escape_string((string)utf8_decode($input->firstname));
    $lastname = $conn->real_escape_string((string)utf8_decode($input->lastname));
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
    //echo "you requested id $id"; 
        
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

    $page = $app->request()->params('page');
    $page_size = $app->request()->params('per_page');
    
    if ($page_size == "")
        $page_size = 50;
    
    
    
   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }
    
    // get the count of records
    $result = query($conn, "SELECT count(*) from Clients");
    $row = $result->fetch_assoc();
    $client_count = $row['count(*)'];
    $page_count = ceil($client_count / $page_size);
    
    if ($page) {
        $limit_from = ($page - 1) * $page_size;
        
        if ($limit_from > $client_count) {
            $page = ceil($client_count / $page_size);
            $limit_from = $client_count - ($client_count % $page_size);
            //$limit_from -= $page_size;
        }
        
        $result = query($conn, "SELECT ID, firstname, lastname, dob, address, city, postalcode from Clients LIMIT " . $limit_from . "," . $page_size);
    } else {        
        $result = query($conn, "SELECT ID, firstname, lastname, dob, address, city, postalcode from Clients");
    }

    
    $clients = [];
    while ($row = $result->fetch_assoc()) {
        $c = new Client($row['ID'], $row['firstname'], $row['lastname'], $row['dob'], $row['address'], $row['city'], $row['postalcode']);
        array_push($clients, $c->toJSON());
    }
    
    $app->response['Content-Type'] = 'application/json';
    echo '{"page": "' . $page . '", "total_pages": "' . $page_count . '", "per_page": "' . $page_size . '", "clientlist":' . json_encode($clients) . '}';
    //echo html_entity_decode($clients);
    
    $conn->close();

});

$app->get('/search/', function () use ($app) {
    //echo "you requested id $id"; 
        
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

    $firstname = $conn->real_escape_string($app->request()->params('firstname'));
    $lastname = $conn->real_escape_string($app->request()->params('lastname'));
        
   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }
    
    if (strlen($firstname) > 0 && strlen($lastname) > 0) {
        $result = query($conn, "SELECT ID, firstname, lastname, dob, address, city, postalcode from Clients WHERE firstname LIKE '" . $firstname . "%' AND lastname LIKE '" . $lastname . "%'");
    } elseif (strlen($firstname) > 0) {
        $result = query($conn, "SELECT ID, firstname, lastname, dob, address, city, postalcode from Clients WHERE firstname LIKE '" . $firstname . "%'");        
    } else {
        $result = query($conn, "SELECT ID, firstname, lastname, dob, address, city, postalcode from Clients WHERE lastname LIKE '" . $lastname . "%'");        
    }

    $clients = [];
    while ($row = $result->fetch_assoc()) {
        $c = new Client($row['ID'], $row['firstname'], $row['lastname'], $row['dob'], $row['address'], $row['city'], $row['postalcode']);
        array_push($clients, $c->toJSON());
    }
    
    $app->response['Content-Type'] = 'application/json';
    echo '{"page": "1", "total_pages": "1", "per_page": "all", "clientlist":' . json_encode($clients) . '}';
    //echo html_entity_decode($clients);
    
    $conn->close();

});



$app->run();







?>
