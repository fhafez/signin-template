<?php

require "Slim/Slim.php";
\Slim\Slim::registerAutoloader();

class Appointment {
    
    public $id = 0;
    public $client_id = 0;
    public $staff_id = 0;       // unused
    public $firstname = "";
    public $lastname = "";
    public $dob = "";
    public $staffname = "";     // unused
    public $start_datetime = "";
    public $end_datetime = "";
    public $signature_filename = "";
    public $signature_contents = [];
    public $mva = false;

    public function __construct($id, $client_id, $firstname, $lastname, $dob, $start_datetime, $end_datetime, $signature_filename, $signature_contents, $staff_id, $staff_fname, $staff_lname, $mva) {

        $this->id = $id;
        $this->client_id = $client_id;
        $this->firstname = utf8_encode($firstname);
        $this->lastname = utf8_encode($lastname);
        $this->dob = $dob;
        $this->start_datetime = $start_datetime;
        $this->end_datetime = $end_datetime;
        $this->signature_filename = $signature_filename;
        $this->signature_contents = $signature_contents;
        $this->staff_id = $staff_id;
        $this->staff_firstname = $staff_fname;
        $this->staff_lastname = $staff_lname;
        $this->mva = $mva;
    }
    
    public function toJSON() {
        return array(
            "id" => $this->id,
            "client_id" => $this->client_id,
            "firstname" => $this->firstname,
            "lastname" => $this->lastname,
            "dob" => $this->dob,
            "start_datetime" => $this->start_datetime,
            "end_datetime" => $this->end_datetime,
            "signature_filename" => $this->signature_filename,
            "signature_contents" => $this->signature_contents,
            "staff" => array("staff_id" => $this->staff_id, "staff_firstname" => $this->staff_firstname, "staff_lastname" => $this->staff_lastname),
            "mva" => $this->mva,
            "message" => "SUCCESS"
        );
    }
}

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

$app->get('/(:cid)', function ($cid=-1) use ($app) {
    
//    echo "from " . $fr . " to " . $to;

    $dtfrom = $app->request()->params('from');
    $dtto = $app->request()->params('to');
    $page = $app->request()->params('page');
    $page_size = $app->request()->params('page_size');
    $client_fname = $app->request()->params('firstname');
    $client_lname = $app->request()->params('lastname');
    $client_dob = $app->request()->params('dob');
    $staff_id = $app->request()->params('staff_id');    

    $rfr = ($page - 1) * $page_size;
    
    include "db.php";

    try {
 
        $conn = new mysqli($servername, $username, $password, $dbname);

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        $query_str = "SELECT a.id as aid, s.id as sid, a.sig_filename as sig, c.id as cid, c.dob as dob, a.mva as mva, staff_id,
                                    c.firstname, c.lastname, DATE_FORMAT(a.appt_date, '%e-%M-%Y %h:%i%p') as dt, 
                                    DATE_FORMAT(a.signout_date, '%e-%M-%Y  %h:%i%p') as dtto, s.firstname as s_fname, s.lastname as s_lname
                                    FROM 
                                        Clients c, Appointments a
                                    LEFT JOIN Staff s ON a.staff_id = s.id 
                                    WHERE 
                                        a.client_id = c.id
                                        AND a.appt_date >= date('" . $dtfrom . "') 
                                        AND a.appt_date <= date('" . $dtto . "')";


        if (strlen($client_fname) > 0) {
            $query_str .= " AND lower(c.firstname) = '" . $client_fname . "'";
        }

        if (strlen($client_lname) > 0) {
            $query_str .= " AND lower(c.lastname) = '" . $client_lname . "'";
        }

        if (strlen($client_dob) > 0) {
            $query_str .= " AND c.dob = '" . $client_dob . "'";
        }

        if (strlen($staff_id) > 0 && $staff_id != '1') {
            $query_str .= " AND (a.staff_id = " . $staff_id . " OR  a.staff_id is null)";
        }

        if ($cid != -1) {
            $query_str .= " AND c.id = " . $cid;
        }

        $query_str .= " ORDER BY a.appt_date LIMIT " . $rfr . "," . $page_size;

        $result = query($conn, $query_str);

        $appointments = [];
        $xml_sig_contents = "";
        
        while ($row = $result->fetch_assoc()) {

            try {
                $sig_contents = file_get_contents("../signatures/" . $row['sig']);
                $xml_sig_contents = new SimpleXMLElement($sig_contents);

                $children = $xml_sig_contents->children()->count();
                $xml_path_d_content = [];

                for ($i=0; $i < $children; $i++) { 
                    array_push($xml_path_d_content, $xml_sig_contents->children()[$i]['d']);
                }

            } catch (Exception $e) {
                print $e->getMessage();
                $xml_sig_contents = "";
            }

            $a = new Appointment($row['aid'], $row['cid'], $row['firstname'], $row['lastname'], $row['dob'], $row['dt'], $row['dtto'], $row['sig'], $xml_path_d_content, $row['sid'], $row['s_fname'], $row['s_lname'], $row['mva']);
            array_push($appointments, $a->toJSON());
        }
    } catch (Exception $e) {
        $app->response()->status(400);
        $app->response()->header('X-Status-Reason', $e->getMessage());
    }
    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($appointments);

    $conn->close();

});


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


//$app->delete('/hello/:id', function($id) {
$app->delete('/:id', function ($id) use ($app) {    

    include "db.php";

    if (ctype_digit((string)$id)) {
        $conn = new mysqli($servername, $username, $password, $dbname);

       if ($conn->connect_errno) {
            printf("DB Connection Failure %s\n", $conn->connect_error);
            exit();
        }

        $conn->autocommit(FALSE);
        //$result = query($conn,"START TRANSACTION");
        
        $conn->query('START TRANSACTION');
        $conn->query("INSERT INTO Del_Appts select * from Appointments where id=" . $id);
        if ($conn->errno > 0) {
            echo "Error: " + $conn->errno;
            $app->response()->status(410);
            $conn->close();
            return;
        }
        
        $conn->query("DELETE FROM Appointments where id=" . $id);
        if ($conn->errno > 0) {
            echo "Error: " + $conn->errno;
            $app->response()->status(411);
            $conn->close();
            return;
        }

        $conn->query('COMMIT');

        if ($conn->errno) {
            $conn->rollBack();
            echo $conn->errno;
            $app->response()->status(412);
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

    $appt_date = $conn->real_escape_string((string)$input->start_datetime);
    $signout_date = $conn->real_escape_string((string)$input->end_datetime);
    $sig_filename = $conn->real_escape_string((string)$input->signature_filename);
    $sig_contents = $input->signature_contents;
    $staff_id = $input->staff->staff_id;
    $mva = ($input->mva == 1) ? "true" : "false";

    /*
    var_dump($input);
    exit();
    /*
    $dob_year = (int)explode("-", $dob)[0];
    $dob_month = (int)explode("-", $dob)[1];
    $dob_day = (int)explode("-", $dob)[2]; 
    */

    //$result = query($conn, "UPDATE Appointments SET appt_date='" . $appt_date . "', signout_date='" . $signout_date . "', sig_filename='" . $sig_filename . "' where ID=" . $id);

    if ($staff_id == "") {
        $staff_id = 7;
    }

    if ($signout_date == "null") {
        $result = query($conn, "UPDATE Appointments SET 
            staff_id=" . $staff_id . ",
            mva=" . $mva . " WHERE ID=" . $id);
    } else {
        $result = query($conn, "UPDATE Appointments SET 
            signout_date=STR_TO_DATE('" . $signout_date . "', '%Y-%m-%e %H:%i:%s'), 
            staff_id=" . $staff_id . ",
            mva=" . $mva . " WHERE ID=" . $id);        
    }    
    
    if ($conn->affected_rows == 1) {

        $query_str = "SELECT a.id as aid, s.id as sid, a.sig_filename as sig, c.id as cid, c.dob as dob, a.mva as mva,
                                    c.firstname, c.lastname, DATE_FORMAT(a.appt_date, '%e-%M-%Y %h:%i%p') as dt, 
                                    DATE_FORMAT(a.signout_date, '%e-%M-%Y  %h:%i%p') as dtto, s.firstname as s_fname, s.lastname as s_lname
                                    FROM 
                                        Clients c, Appointments a
                                    LEFT JOIN Staff s ON a.staff_id = s.id 
                                    WHERE 
                                        a.client_id = c.id AND
                                        a.id = " . $id;

        $result = query($conn, $query_str);
        $row = $result->fetch_assoc();
        $a = new Appointment($row['aid'], $row['cid'], $row['firstname'], $row['lastname'], $row['dob'], $row['dt'], $row['dtto'], $row['sig'], $sig_contents[0], $row['sid'], $row['s_fname'], $row['s_lname'], $row['mva']);

        $app->response['Content-Type'] = 'application/json';
        echo json_encode($a->toJSON());
        $app->response()->status(200);

    } else {

        $app->response()->status(500);
        $app->response()->header('X-Status-Reason', 'Incorrect number of rows changed ' . $conn->affected_rows);
    }

  } catch (ResourceNotFoundException $e) {
    $app->response()->status(404);
  } catch (Exception $e) {
    $app->response()->status(400);
    $app->response()->header('X-Status-Reason', $e->getMessage());
  }    
    
    $conn->close();
    
});

$app->get('/client/:id(/:dtfr/:dtto(/:rfr/:num_recs))', function ($id, $dtfr="", $dtto="", $rfr=1, $num_recs=500) use ($app) {
 
    include "db.php";
 
    $conn = new mysqli($servername, $username, $password, $dbname);

   if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    if (strlen($dtto) > 0 && strlen($dtfr) > 0) {
        
        $result = query($conn, "SELECT a.id as aid, a.sig_filename as sig, aserv.id as serviceid, s.name as service_name, c.id as cid, 
                                c.firstname, c.lastname, DATE_FORMAT(a.appt_date, '%e-%M-%Y  %h:%i%p') as dt, 
                                DATE_FORMAT(a.signout_date, '%e-%M-%Y  %h:%i%p') as dtto 
                                FROM 
                                    Clients c, Appointments a, Appointment_Services aserv, Services s
                                WHERE                                
                                    a.client_id = " . $id . " AND a.client_id = c.id AND aserv.appointment_id = a.id AND s.id = aserv.service_id
                                    AND a.appt_date > date('" . $dtfr . "') AND a.appt_date < date('" . $dtto . "')
                                ORDER BY a.appt_date
                                LIMIT " . $rfr . "," . $num_recs);
    } else {

        $result = query($conn, "SELECT a.id as aid, a.sig_filename as sig, aserv.id as serviceid, s.name as service_name, c.id as cid, 
                                c.firstname, c.lastname, DATE_FORMAT(a.appt_date, '%e-%M-%Y  %h:%i%p') as dt, 
                                DATE_FORMAT(a.signout_date, '%e-%M-%Y  %h:%i%p') as dtto 
                                FROM 
                                    Clients c, Appointments a, Appointment_Services aserv, Services s
                                WHERE                                
                                    a.client_id = " . $id . " AND a.client_id = c.id AND aserv.appointment_id = a.id AND s.id = aserv.service_id
                                ORDER BY a.appt_date
                                LIMIT " . $rfr . "," . $num_recs);

    }
    
    $appointments = [];
    while ($row = $result->fetch_assoc()) {
        $a = new Appointment($row['aid'], $row['cid'], $row['firstname'], $row['lastname'], $row['dob'], $row['dt'], $row['dtto'], $row['sig'], true);
        array_push($appointments, $a->toJSON());
    }    

    
    $app->response['Content-Type'] = 'application/json';
    echo json_encode($appointments);

    $conn->close();
    
});

$app->run();

?>
