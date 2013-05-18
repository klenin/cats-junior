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

		case "usersListRequest":

			readfile('users.json');

			break;

		case "contestsListRequest":

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

