<?php

require "Slim/Slim.php";
\Slim\Slim::registerAutoloader();

class Service {
    
    public $id = 0;
    public $description = 0;
    
    public function __construct($id, $description) {
        $this->id = $id;
        $this->description = $description;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "description" => $this->description, 
            "message" => "SUCCESS"
        );
    }
}

class Available_Appts {
    
    public $id = 0;
    public $remaining_appts;
    public $service_id;
    public $service_name;
    public $provider_id;
    public $provider_name;
    public $active_on;
    public $active_now;
    public $expires_on;
    public $mva;
    
    public function __construct($id, $remaining_appts, $service_id, $service_name, $provider_id, $provider_name, $active_on, $active_now, $expires_on, $mva) {
        $this->id = $id;
        $this->remaining_appts = $remaining_appts;
        //$this->description = $description;
        $this->service_id = $service_id;
        $this->service_name = $service_name;
        $this->provider_id = $provider_id;
        $this->provider_name = $provider_name;
        $this->active_on = $active_on;
        $this->active_now = $active_now;
        $this->expires_on = $expires_on;
        $this->mva = $mva;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "remaining_appts" => $this->remaining_appts, 
            "service_id" => $this->service_id, 
            "service_name" => $this->service_name, 
            "provider_id" => $this->provider_id, 
            "provider_name" => $this->provider_name, 
            "active_on" => $this->active_on, 
            "active_now" => $this->active_now, 
            "expires_on" => $this->expires_on, 
            "mva" => $this->mva, 
            "message" => "SUCCESS"
        );
    }

    
}


function query($conn, $sql_query) {

    $result =  $conn->query($sql_query);
    if ($result == FALSE) {
        printf("{Error: 'DB Query Failure %s' }\n", $conn->error);
        exit();
    }
    
    return $result;
}

$app = new \Slim\Slim();

$app->get('/(:cid)', function ($sid=-1) use ($app) {
    
    $id = $app->request()->params('id');
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    if ($id != "") {
        $result = query($conn, "SELECT ID, name FROM Services WHERE ID=" . $id);
    } else {
        $result = query($conn, "SELECT ID, name FROM Services WHERE name <> 'Unspecified'");
    }
    
    $services = [];
    
    while ($row = $result->fetch_assoc()) {
        $s = new Service($row['ID'], $row['name']);
        array_push($services, $s->toJSON());
    }    
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($services);

    $conn->close();

});


/*
 * return count of all remaining services for a client given the client id
 * included in the return array will be:
 * service name
 * service id
 * provider name
 * provider id
 * available appt id
 * remaining appts
 * expires on
 * active on
 * active now
 * mva
*/
$app->get('/remaining/(:cid)', function ($sid=-1) use ($app) {
    
    if ($sid == -1)
        $id = $app->request()->params('id');
    else
        $id = $sid;
    
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    if ($id != "") {
        $result = query($conn, "SELECT aa.ID as ID, s.id as SID, s.name as SERVICE_NAME, aa.remaining_appts as REMAINING_APPTS, p.id as PID, p.provider as PROVIDER_NAME, aa.expires_on as EXPIRES_ON, aa.active_on as ACTIVE_ON, aa.active_now as ACTIVE_NOW, aa.mva as MVA FROM 
                                Services s, Available_Appts aa, Plans p
                                WHERE aa.plan_id=p.ID AND s.id=aa.service_id AND aa.client_id=" . $id);
    } else {
        $result = query($conn, "SELECT ID, name FROM Services");
    }
    
    $available_appts = [];
    
    // $id, $remaining_appts, $service_id, $service_name, $provider_id, $provider_name, $active_on, $active_now, $expires_on, $mva
    
    while ($row = $result->fetch_assoc()) {
        $s = new Available_Appts($row['ID'], $row['REMAINING_APPTS'], $row['SID'], $row['SERVICE_NAME'],$row['PID'],$row['PROVIDER_NAME'],$row['ACTIVE_ON'],($row['ACTIVE_NOW'] == '0') ? 'no' : 'yes' ,$row['EXPIRES_ON'],($row['MVA'] == '0') ? 'no' : 'yes');
        array_push($available_appts, $s->toJSON());
    }    
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($available_appts);

    $conn->close();

});



// delete a service
$app->delete('/:id', function ($id) use ($app) {    

    include "db.php";

    if (ctype_digit((string)$id)) {
        $conn = new mysqli($servername, $username, $password, $dbname);

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        $conn->autocommit(FALSE);
        
        $conn->query('START TRANSACTION');

        $conn->query("DELETE FROM Services where id=" . $id);
        if ($conn->errno > 0) {
            echo "Error: " + $conn->errno;
            $app->response()->status(402);
            $conn->close();
            return;
        }

        $conn->query('COMMIT');

        if ($conn->errno) {
            $conn->rollBack();
            echo $conn->errno;
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


$app->post('/', function () use ($app) {

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

    $service_description = $conn->real_escape_string((string)$input->description);

    if (!$service_description) {
        echo "{error: 'no description provied'}";
        $app->response()->status(400);
    } else {

        try {
            $new_result = query($conn, "INSERT INTO Services (name) 
                                        values 
                                        ('" . $service_description . "')");
        } catch (Exception $e) {
            echo "{error: ' " . $e->getMessage() . " '}";
            $app->response()->status(400);
            return;
        }

        if ($conn->errno) {

            echo "{error: ' " . $conn->errno . " '}";
            $app->response()->status(400);
            
        } else {
            
            $sid = $conn->insert_id;

            $app->response()->status(200);    
            $app->response['Content-Type'] = 'application/json';

            $s = new Service($sid, $service_description);
            echo json_encode($s->toJSON());
        }
    }    

    } catch (ResourceNotFoundException $e) {
        $app->response()->status(404);
    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }    

    $conn->close();
    
    
});

$app->post('/clientservice/', function () use ($app) {

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

    $client_id = $conn->real_escape_string((string)$input->client_id);
    $service_id = $conn->real_escape_string((string)$input->service_id);
    $remaining_appts = $conn->real_escape_string((string)$input->remaining_appts);
    $plan_id = $conn->real_escape_string((string)$input->plan_id);
    $active_on = $conn->real_escape_string((string)$input->active_on);
    $mva = $conn->real_escape_string((string)$input->mva);

    //echo var_dump($input);

    if (!$client_id || !$service_id || !$plan_id || strlen($remaining_appts) == 0) {
        echo "{error: 'missing client_id, service_id, plan_id or remaining_appts'}";
        $app->response()->status(400);
    } else {

        $mva = ($mva == "yes") ? 1 : 0;
        $active_on = (strlen($active_on) == 0) ? 'CURDATE()' : "'" . $active_on . "'";
        
        try {
            $new_result = query($conn, "INSERT INTO Available_Appts (client_id, service_id, remaining_appts, plan_id, expires_on, active_on, active_now, mva) 
                                        values 
                                        (" . $client_id . "," . $service_id . "," . $remaining_appts . "," . $plan_id . "," . "NULL, " . $active_on . ", TRUE, " . $mva . ")");
        } catch (Exception $e) {
            echo "{error: ' " . $e->getMessage() . " '}";
            $app->response()->status(400);
            return;
        }

        if ($conn->errno) {

            echo "{error: ' " . $conn->errno . " '}";
            $app->response()->status(400);
            
        } else {

            $aaid = $conn->insert_id;
            
            // get the details of the available appointment added
            $result = query($conn, "SELECT aa.ID as ID, s.id as SID, s.name as SERVICE_NAME, aa.remaining_appts as REMAINING_APPTS, p.id as PID, p.provider as PROVIDER_NAME, aa.expires_on as EXPIRES_ON, aa.active_on as ACTIVE_ON, aa.active_now as ACTIVE_NOW, aa.mva as MVA FROM 
                                    Services s, Available_Appts aa, Plans p
                                    WHERE aa.plan_id=p.ID AND s.id=aa.service_id AND aa.id=" . $aaid);
            
            $row = $result->fetch_assoc();
            $aa = new Available_Appts($row['ID'], $row['REMAINING_APPTS'], $row['SID'], $row['SERVICE_NAME'],$row['PID'],$row['PROVIDER_NAME'],$row['ACTIVE_ON'],($row['ACTIVE_NOW'] == '0') ? 'no' : 'yes' ,$row['EXPIRES_ON'],($row['MVA'] == '0') ? 'no' : 'yes');

            $app->response()->status(200);
            $app->response['Content-Type'] = 'application/json';

            echo json_encode($aa->toJSON());
        }
    }    

    } catch (ResourceNotFoundException $e) {
        $app->response()->status(404);
    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }    

    $conn->close();
    
    
});

// delete a service
$app->delete('/clientservice/:id', function ($id) use ($app) {    

    include "db.php";

    if (ctype_digit((string)$id)) {
        $conn = new mysqli($servername, $username, $password, $dbname);

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        $conn->autocommit(FALSE);
        
        $conn->query('START TRANSACTION');
        $conn->query("INSERT INTO Del_Available_Appts SELECT * FROM Available_Appts where id=" . $id);
        $conn->query("DELETE FROM Available_Appts where id=" . $id);
        if ($conn->errno > 0) {
            echo "Error: " + $conn->errno;
            $app->response()->status(402);
            $conn->close();
            return;
        }

        $conn->query('COMMIT');

        if ($conn->errno) {
            $conn->rollBack();
            echo $conn->errno;
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

// update a service
$app->put('/clientservice/:id', function ($id) use ($app) {    

    include "db.php";

    $request = $app->request();
    $body = $request->getBody();
    $input = json_decode($body);

    if (ctype_digit((string)$id)) {
        $conn = new mysqli($servername, $username, $password, $dbname);

        $remaining_appts = $conn->real_escape_string((string)$input->remaining_appts);
        $mva = ($conn->real_escape_string((string)$input->mva) == "no") ? 0 : 1;
        $active_on = $conn->real_escape_string((string)$input->active_on);

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        $conn->autocommit(FALSE);
        
        $conn->query('START TRANSACTION');
        $conn->query("UPDATE Available_Appts SET remaining_appts=" . $remaining_appts . ", mva=" . $mva . " , active_on='" . $active_on . "' where id=" . $id);
        if ($conn->errno > 0) {
            echo "Error: " + $conn->errno;
            $app->response()->status(402);
            $conn->close();
            return;
        }

        $conn->query('COMMIT');

        if ($conn->errno) {
            $conn->rollBack();
            echo $conn->errno;
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


$app->put('/:id', function ($id) use ($app) {

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

    $service_description = $conn->real_escape_string((string)$input->description);

    $result = query($conn, "UPDATE Services SET name='" . $service_description . "' WHERE ID=" . $id);
    
    if ($conn->affected_rows >= 0) {
        $app->response()->status(200);
    } else {
        $app->response()->header('X-Status-Reason', "total affected rows " . $conn->affected_rows);        
        $app->response()->status(500);
    }

    //echo "{success: 'modified service'" . $id . "}";

  } catch (ResourceNotFoundException $e) {
    $app->response()->status(404);
  } catch (Exception $e) {
    $app->response()->status(400);
    $app->response()->header('X-Status-Reason', $e->getMessage());
  }    
    
    $conn->close();
    
});

$app->run();

?>
