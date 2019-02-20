<?php
require 'vendor/autoload.php';
use Google\Cloud\Datastore\DatastoreClient;

class Appointment {

    public $id = 0;
    public $client_id = 0;
    public $staff_id = 0;
    public $signin_date = "";
    public $signout_date = "";
    public $signature = "";

    public function __construct($signin_date, $signout_date, $signature) {
        $this->signin_date = $signin_date;
        $this->signout_date = $signout_date;
        $this->signature = $signature;
    }

    public function toJSON() {
        return array(
            "signin_date" => $this->signin_date,
            "signout_date" => $this->signout_date,
        );
    }

    public function save($patientID) {

        date_default_timezone_set('America/Toronto');

        // example of datetime GQL search (https://tools.ietf.org/html/rfc3339):
        //      select * from Patient where appointments.signedInAt > DATETIME("2019-02-18T19:02:37.0000-05:00")

        $datastore = new DatastoreClient();

//        try {

            $key = $datastore->key('Patient', $patientID);

/*
            // query for the patient
            $datastore->query()->kind('Patient')
            ->filter('firstname','=',$firstname)
            ->filter('lastname','=',$lastname)
            ->filter('dob', '>', new DateTime())
            ->filter('dob', '<', new DateTime());
*/

            // get the patient and add the current appointment to it's array of appointments
            $patientEntity = $datastore->lookup($key);
            $appointments = $patientEntity['appointments'];
            $appointments[] = [
                "signedInAt" => $this->signin_date,
                "signedOutAt" => $this->signout_date,
                "signature" => $this->signature
            ];

            $patientEntity['appointments'] = $appointments;
            $datastore->update($patientEntity);

            return $this->toJSON();
/*
        } catch (ResourceNotFoundException $e) {
            $app->response()->status(404);
            $app->response()->header('X-Status-Reason', $e->getMessage());
        } catch (Exception $e) {
            $app->response()->status(400);
            $app->response()->header('X-Status-Reason', $e->getMessage());
        }
*/
    }
}

class Available_Appointments {

    public $id = 0;
    public $service_id = 0;
    public $service_name = 0;
    public $provider_id = 0;
    public $provider_name = 0;
    public $remaining_appts = "";
    public $expires_on = "";
    public $active_on = "";
    public $active_now = "";
    public $mva = "";

    public function __construct($id, $service_id, $service_name, $provider_id, $provider_name, $remaining_appts, $expires_on, $active_on, $active_now, $mva) {
        $this->id = $id;
        $this->service_id = $service_id;
        $this->service_name = $service_name;
        $this->provider_id = $provider_id;
        $this->provider_name = $provider_name;
        $this->remaining_appts = $remaining_appts;
        $this->expires_on = $expires_on;
        $this->active_on = $active_on;
        $this->active_now = $active_now;
        $this->mva = $mva;
    }

    public function toJSON() {
        return array(
            "id" => $this->id,
            "service_id" => $this->service_id,
            "service_name" => $this->service_name,
            "provider_id" => $this->provider_id,
            "provider_name" => $this->provider_name,
            "remaining_appts" => $this->remaining_appts,
            "expires_on" => $this->expires_on,
            "active_on" => $this->active_on,
            "active_now" => $this->active_now,
            "mva" => $this->mva,
            "message" => "SUCCESS"
        );
    }
}

