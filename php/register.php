<?php

include "clean.php";
include "db.php";


$failedregmsg = '';
$completed_registration = FALSE;

$firstname = trim(strtolower($_POST['firstname']));
$lastname = trim(strtolower($_POST['lastname']));
$dob_year = $_POST['dob_year'];
$dob_month = $_POST['dob_month'];
$dob_day = $_POST['dob_day'];
$dob = $dob_year . "-" . $dob_month . "-" . $dob_day;

function query($conn, $sql_query) {

    $result =  $conn->query($sql_query);
    if ($result == FALSE) {
        printf("DB Query Failure %s\n", $conn->error);
        exit();
    }
    
    return $result;
}

// If the username and password have been passed in then begin processing
if (strlen($firstname) != 0 && strlen($lastname) != 0 && strlen($dob) != 0) {
    
    // Connect to database
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_errno) {
        printf("DB Connection Failure %s\n", $conn->connect_error);
        exit();
    }

    // need to sanitize input to protect against SQLi attacks
    $firstname = $conn->real_escape_string($firstname);
    $lastname = $conn->real_escape_string($lastname);
    $dob = $conn->real_escape_string($dob);
        
    // check if the username and passowrds match a user in the database
    $result =  query($conn, "select id from Clients where firstname='" . $firstname . "' and lastname='" . $lastname . "' and dob = '" . $dob . "'");
    
    if ($result->num_rows > 0) {
        $failedregmsg = 'A patient with that Name and Date of Birth already exists.';
    } else {

        // Start a transaction
	   	$result = query($conn, "START TRANSACTION");

        // Add the client into the database
        $result = query($conn, "INSERT INTO Clients (firstname, lastname, dob, username, password) values ('" . $firstname . "', '" . $lastname . "', '". $dob."', '". $firstname . $lastname ."', '". $lastname ."')");

        $result = query($conn, "INSERT INTO Client_Plan (client_id, plan_id) SELECT last_insert_id(), id from Plans WHERE Provider='None'");
        
        // Commit the transaction
	   	$result = query($conn, "COMMIT");

        
        $completed_registration = TRUE;
    }
    
    
    $conn->close();
}

?>
<html>
<head>
<link rel="stylesheet" href="../css/style.css">
<style type="text/css">

	div {
		margin-top:1em;
		margin-bottom:1em;
	}
	input {
		padding: .5em;
		margin: .5em;
	}
	select {
		padding: .5em;
		margin: .5em;
	}
	
	/* Drawing the 'gripper' for touch-enabled devices */ 
	html.touch #content {
		float:left;
		width:92%;
	}
	html.touch #scrollgrabber {
		float:right;
		width:4%;
		margin-right:2%;
        /*
		background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAFCAAAAACh79lDAAAAAXNSR0IArs4c6QAAABJJREFUCB1jmMmQxjCT4T/DfwAPLgOXlrt3IwAAAABJRU5ErkJggg==)
        */
	}
	html.borderradius #scrollgrabber {
		border-radius: 1em;
	}
    .logindiv {
        background-color:transparent;
        border: 0px transparent;
        border-color:#4C6680;
        padding:10px;
        width:370px;
        position: relative;
        margin-left:auto;
        margin-right:auto;
        margin-top: 0px;
        text-align: center;
    }
    .loginlsdiv {
        background-color:transparent;
        border: 0px transparent;
        border-color:#4C6680;
        padding:0px;
        width:100%;
        position: relative;
        margin-left:auto;
        margin-right:auto;
        margin-top: 0px;
        text-align: center;
    }
    #loginbtn {
        font-family: vedrana, sans-serif;
        font-size: 18px;
        background: #007ACC;
        padding:15px;
        border: 1px solid #AAAAAA;
        text-align: center;
        border-radius: 5px;
        text-decoration:none;
    }
    #loginlsbtn {
        font-family: vedrana, sans-serif;
        font-size: 18px;
        background: #007ACC;
        padding:15px;
        border: 1px solid #AAAAAA;
        text-align: center;
        border-radius: 5px;
        width: 220px;
        text-decoration:none;
        margin-left:auto;
        margin-right:auto;
        display: inline-block;
    }
    .datefield {
        display: inline;
        padding: 10px;
        border: solid 1px #AAAAAA;
        background: #FFF;
        border-radius: 5px;
        color: #666;
    }

    .datefield * {
        display: inline-block;
    }

    .datefield input {
        width: 4em;
        padding:10px 10px;
        border: none;
        font-size: 18px;
        background: none;
        color:#4C6680;
    }

    .datefield input#year { width:70px; }
    .datefield input#month { width:50px; }
    .datefield input#day { width:50px; }
    .datefield input:focus { outline:none; }
	 
</style>
  <script>
      function isDate(val) {
        var d = new Date(val);
        return !isNaN(d.valueOf());
      }
      
      function submitForm() {
          var dt = document.regform.month.value + "/" + document.regform.day.value + "/" + document.regform.year.value;
          if (document.regform.firstname.value.length == 0 || document.regform.lastname.value.length == 0 || document.regform.day.value.length == 0 || document.regform.month.value.length == 0 || document.regform.year.value.length == 0) {
              document.getElementById("errors").innerHTML = 'Firstname, Lastname and Date of Birth fields cannot be blank';
              document.getElementById("errors").style.display = 'block';
              if (document.regform.firstname.value.length == 0)
                    document.getElementById("firstname").style.borderColor = '#cc0000';
              if (document.regform.lastname.value.length == 0)
                    document.getElementById("lastname").style.borderColor = '#cc0000';
              if (document.regform.day.value.length == 0 || document.regform.month.value.length == 0 || document.regform.year.value.length == 0)
                    document.getElementById("dob").style.borderColor = '#cc0000';
          } else if (!isDate(dt)) {
              document.getElementById("errors").innerHTML = 'Date of Birth is not a valid date.';
              document.getElementById("errors").style.display = 'block';
          } else {
              document.getElementById('regform').submit();
          }
      }
  </script>
</head>
<body>
<header><h1><?=$sitename?></h1></header>
    <h2>
        <table style='width:100%; background: transparent; border: 0px transparent;'>
            <tr class='tr-no-hover' style=' background: #F5FAFF; border: 0px transparent; border-radius:0px;'>
                <td style='background: transparent; border-style: none none solid none; border-width: 0.5px border-color: #AAAAAA; border-radius: 0px;'>&nbsp;</td>
                <td align='center' style='width:80px; background: transparent; padding:10px; border-style: none solid solid none; border-width: 0.5px border-color: #AAAAAA; border-radius: 0px 0px 5px 0px;'><!--img valign='middle' src='images/signin-on-tab.png'/ height='45px'--><a href='/index.html' style="text-decoration:none; font-weight: bold; color:#007ACC; text-align='left'">Sign In<!--img valign='middle' src='images/signout-off-tab.png'/ height='45px'--></a>
                </td>                
                <td align='center' style='width:80px; background: whitesmoke; padding:10px; border-style: none; border-width:0.5px; border-color: #AAAAAA; border-radius:0px; color: #4C6680; font-weight:bold'>Registration</td>
                <td style='width:5px; background: transparent; padding:10px; border-style: none none solid solid; border-width:0.5px #AAAAAA; border-radius:0px 0px 0px 5px; color: #4C6680; font-weight:bold'>&nbsp;
                </td>
            </tr>
        </table>
    </h2>
    <!--h2>
        <a href='../index.html' style="text-decoration:none; color:white;font-family:arial narrow; text-align='left'"><img valign='middle' src='images/signin-off-tab.png' height='45px'/></a><img valign='middle' src='images/signout-on-tab.png' height='45px'/>
    </h2-->
    <div class="headerdiv">Registration Sheet</div>

<? if ($completed_registration == TRUE) { ?>
    <div><p id="successfulsignin">Registration successful.</p></div>
    <div class='signoutdiv' style='width:220px; font-size:24px' onclick="location.href='../index.html'">Go to Signin</div>
<?   } else { ?>
        <div style="margin-top: 100px;">
<?      if ($failedregmsg != '') { ?>
          <div style="margin-top:1px;"><p id="failedlogin"><?=$failedregmsg ?></p></div>
<?      } ?>
        </div>
    <form name='regform' id='regform' action="register.php" method="POST">
    <div class='logindiv'>
        <input id='firstname' maxlength='20' name="firstname" type="text" placeholder="First Name" value="<?=$firstname?>">
        <input id='lastname' maxlength='20' name="lastname" type="text" placeholder="Last Name" value="<?=$lastname?>">
        
        <label for="day">DoB</label>
        <div id="dob" class="datefield">
            <input id="year" name='dob_year' type="tel" maxlength="4" placeholder="YYYY" value="<?=$dob_year?>" />|
            <input id="month" name='dob_month' type="tel" maxlength="2" placeholder="MM" value="<?=$dob_month?>" />|
            <input id="day" name='dob_day' type="tel" maxlength="2" placeholder="DD" value="<?=$dob_day?>" />
        </div>        
    </div>
    <div class="logindiv" align=center>
        <div id='loginbtn' align=center>
            <a style="text-decoration:none; color:white;font-family:verdana;" onclick='submitForm();' href="#">Register</a>
        </div>
        <div id='loginbtn'>
            <a href="#" value="Reset" style="text-decoration:none; color:white;font-family:verdana" onclick='document.forms["regform"].reset();'>Clear</a>
        </div>
    </div>
    <div><p align=center id="errors"></p></div>
    </form>
<? } ?>
</body>
</html>
