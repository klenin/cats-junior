<?php
	foreach($_POST as $key=>$value ) ${$key}=$value;
	foreach($_GET as $key=>$value ) ${$key}=$value;
	//$source = "trrrrr";
	$params = 'source='.$source.'&problem_id='.$problem_id.'&de_id='.$de_id; 

	$boundary = md5(rand(0,32000));
	$sep = "--" . $boundary . "\r\n";

	function GenPostQuery($path, $serv, $data)
	{
		global $boundary;
		$result = "POST " . $path . " HTTP/1.1\r\n";
		$result .= "Host: ". $serv . "\r\n";
		$result .= "Connection: Close\r\n";
		$result .= "Referer: " . $serv . "\r\n";
		$result .= "Content-Type: multipart/form-data; Content-Disposition: multipart/form-data; boundary=" . $boundary . ";\r\n";
		$result .= "Content-Length: " . strlen($data). "\r\n\r\n";
		$result .= $data;
		return $result;
	}
	function GenFieldData($name, $value)
	{
		global $sep;
		$result = $sep . 'Content-Disposition: form-data; name="' . $name . '"' . "\r\n\r\n";
		$result .= $value . "\r\n";
		return $result;
	}

	function GenFileFieldData($name, $filename, $type, $data)
	{
		global $sep;
		$result = $sep . 'Content-Disposition: form-data; name="' . $name . '"; filename="' .$filename . '"' . "\r\n";
		$result .= 'Content-Type: ' . $type . "\r\n\r\n";
		$result .= $data . "\r\n\r\n";
		return $result;
	}
	
	$data = GenFieldData("search", "");
	$data .= GenFieldData("rows", "20");
	$data .= GenFieldData("problem_id", $problem_id);
	$data .= GenFieldData("de_id", $de_id);
	$data .= GenFieldData("submit", "Send");
	$data .= GenFileFieldData("source", "output.txt", "text/plain", $source);
	$data .= GenFileFieldData("zip", "", "application/octet-stream", "");
	$data .= "--". $boundary . "--\r\n";
	$query = GenPostQuery($path, $serv, $data);
	echo $query;
	
	$fp = fsockopen($serv, 80);
	if (!$fp)
		die("Can't open socket.");

	fputs($fp, $query);
	
	while($gets = fgets($fp))
	{
		echo $gets;
	}
	
	fclose($fp);
?>
