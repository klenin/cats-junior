<?php
	//$url = 'http://imcs.dvgu.ru/cats/main.pl?f=login;login=test;passwd=test;json=1;';
	foreach($_POST as $key=>$value ) ${$key}=$value;
	foreach($_GET as $key=>$value ) ${$key}=$value;
	$json = file_get_contents($url);
	echo $json;
?>