<!doctype html>
<html>
<head>
<link id="icon" rel="shortcut icon" type="image/x-icon" href="//<?php echo $_SERVER['HTTP_HOST'];?>/Doc/head.ico">
<style>
* {
	font: Cambria, "Hoefler Text", "Liberation Serif", Times, "Times New Roman", serif;
}
</style>
<meta charset="utf-8">
<?php 
	$errdic = array('400'=>'400 Bad Request', '404'=>'404 Not Found', '403'=>'403 Forbidden', '402'=>'What is 402?', '500'=>'500 Server Error', '414'=>'414 Request Too Long');
	$errcodes = array('404', '403', '402', '500', '400', '414');
	if (!empty($_GET['code'])){
		$code = $_GET['code'];
		if (in_array($code, $errcodes))
			$display = $errdic[$code];
		else
			$display = $code;
	}
	else $display = '404 Not Found';
	
?>
<title><?php echo $display;?></title>
</head>

<body style="text-align: center; font-size: 36px;">
<table style="margin:auto auto;">
    <tr>
        <td><img id="img1" src="//<?php echo $_SERVER['HTTP_HOST'];?>/Doc/int1.jpg"/></td>
        <td><span><?php echo $display;?><br />Very Interesting</span></td>
        <td><img id="img2" src="//<?php echo $_SERVER['HTTP_HOST'];?>/Doc/int2.jpg"/></td>
    </tr>
    <tr>
    	<td colspan="3">
        	<p style="background-color: #BBBBBB; color:#FFFFFF; font-size: 20px; padding: 10px;">
            	© 2016-2017 周涵之 Hanzhi Zhou. All Rights Reserved.
            </p>
        </td>
    </tr>
</table>
</body>
</html>
