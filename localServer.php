<?php
	foreach($_POST as $key=>$value ) ${$key}=$value;
	foreach($_GET as $key=>$value ) ${$key}=$value;
	
	switch($action)
	{
		case "login":
		case "logout":
		case "submit":
		case "getConsoleContent":
		case "getCode":
			echo '{}';
			break;
		case "getUsersList":
			readfile('users.json');
			break;
		case "getContestsList":
			readfile('contests.json');
			break;
		case "getProblems":
			readfile('problems.json');
			break;
		case "getResults": 
			echo "Здесь должны быть результаты";
			break;
	}

?>
