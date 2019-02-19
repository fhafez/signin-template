<?php

require "Slim/Slim.php";
\Slim\Slim::registerAutoloader();

class Provider {
    
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
    
    
    //echo $id;
    //return;

    include "db.php";
 
    try {

        $conn = new mysqli($servername, $username, $password, $dbname);

        $id = $conn->real_escape_string((string)$app->request()->params('id'));

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        if ($id != "") {
            $result = query($conn, "SELECT ID, provider FROM Plans WHERE ID=" . $id);
        } else {
            $result = query($conn, "SELECT ID, provider FROM Plans");
        }
        
        $providers = [];
        
        while ($row = $result->fetch_assoc()) {
            $s = new Provider($row['ID'], $row['provider']);
            array_push($providers, $s->toJSON());
        }    
        
        $app->response['Content-Type'] = 'application/json';
        echo json_encode($providers);

        $conn->close();

    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());        
    }

});


$app->put('/(:cid)', function ($sid=-1) use ($app) {
    
    include "db.php";

    $request = $app->request();
    $body = $request->getBody();
    $input = json_decode($body);

    try {


        $conn = new mysqli($servername, $username, $password, $dbname);

        $id = $conn->real_escape_string((string)$input->id);
        $description = $conn->real_escape_string((string)$input->description);     

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        if (!$id || !$description) {
            throw new Exception("id and description must be provided");
        }

        $result = query($conn, "SELECT ID, provider FROM Plans WHERE ID = " . $id);

        if ((int)$result->num_rows == 0) {
            throw new Exception("no matching id");
        }

        $result = query($conn, "UPDATE Plans SET provider = '" . $description . "' WHERE ID = " . $id);

        if ($conn->affected_rows != 1) {
            throw new Exception("update failed: " . $conn->error);
        }
        
        $app->response['Content-Type'] = 'application/json';

        $conn->close();

    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());        
    }


    $curr_provider = new Provider($id, $description);
    $app->response()->status(200);    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($curr_provider->toJSON());

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

        $description = $conn->real_escape_string((string)$input->description);

        if (!$description) {

            throw new Exception("{error: 'no description provied'}");

        } else {

            try {
                $new_result = query($conn, "INSERT INTO Plans (provider) 
                                            values 
                                            ('" . $description . "')");
            } catch (Exception $e) {

                throw new Exception("{error: ' " . $e->getMessage() . " '}");

            }

            if ($conn->errno) {

                throw new Exception("insert failed: " . $conn->error);
                
            } else {
                
                $sid = $conn->insert_id;

                $app->response()->status(200);    
                $app->response['Content-Type'] = 'application/json';

                $s = new Provider($sid, $description);
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

// delete a service
$app->delete('/:id', function ($id) use ($app) {    

    include "db.php";

    try {

        if (ctype_digit((string)$id)) {
            $conn = new mysqli($servername, $username, $password, $dbname);

           if ($conn->connect_errno) {
                throw new Exception("DB Connection Failure %s\n" . $conn->connect_error);
            }

            $conn->autocommit(FALSE);
            
            $conn->query('START TRANSACTION');

            $conn->query("DELETE FROM Plans where id=" . $id);
            if ($conn->errno > 0) {
                throw new Exception("Error: " . $conn->errno);
            }

            $conn->query('COMMIT');

            if ($conn->errno) {

                $conn->rollBack();
                throw new Exception("Error: " . $conn->errno);

            } else {

                $app->response()->status(200);

            }

        } else {

            throw new Exception("{error: '$id non numeric'}");

        }
    } catch (Exception $e) {

        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());

    }

    $conn->close();

});

$app->run();

?>
