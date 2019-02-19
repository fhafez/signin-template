<?php
require 'vendor/autoload.php';
require "Slim/Slim.php";
\Slim\Slim::registerAutoloader();

use Google\Cloud\Datastore\DatastoreClient;

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

// register a new patient
$app->post('/', function () use ($app) {

    date_default_timezone_set('America/Toronto');
    $datastore = new DatastoreClient();
    
    try {

        $request = $app->request();
        $body = $request->getBody();
        $input = json_decode($body);


        $key = $datastore->key('Patient');
        $newPatient = $datastore->entity($key);
        $newPatient['firstname'] = $input->firstname;
        $newPatient['lastname'] = $input->lastname;
        $newPatient['dob'] = new DateTime($input->dob);
        $newPatient['appointments'] = [];
        $newPatient['services'] = [];
        $newPatient['createdOn'] = new DateTime();
        $newPatient['lastModifiedOn'] = new DateTime();

        $datastore->insert($newPatient);
        $app->response()->status(200);
        $app->response['Content-Type'] = 'application/json';

        $c = new Client($key->pathEndIdentifier(), $newPatient['firstname'], $newPatient['lastname'], $newPatient['dob']);
        echo json_encode($c->toJSON());
    } catch (ResourceNotFoundException $e) {
        $app->response()->status(404);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }    
});


$app->run();
