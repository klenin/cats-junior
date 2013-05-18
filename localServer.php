<?php

	foreach($_POST as $key=>$value ) ${$key}=$value;

	foreach($_GET as $key=>$value ) ${$key}=$value;

	

	switch($action)

	{

		case "loginRequest":

		case "logoutRequest":

		case "submitRequest":

		case "consoleContentRequest":

		case "codeRequest":

			echo '{}';
			break;

		case "usersListRequest":

			readfile('users.json');

			break;

		case "contestsListRequest":

			readfile('contests.json');

			break;

		case "problemsListRequest":

			readfile('problems.json');

			break;

		case "resultsRequest": 

			echo "Здесь должны быть результаты";

			break;

	}



?>

