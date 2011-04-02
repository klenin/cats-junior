<?php
	foreach($_POST as $key=>$value ) ${$key}=$value;
	foreach($_GET as $key=>$value ) ${$key}=$value;
	$json = file_get_contents($url);
	echo $json;
?>