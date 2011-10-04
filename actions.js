function nextExecCmdSkulpt(i)
{
	$('#codeMirrorLines').children().removeClass('cm-curline');
	$('#codeMirrorLines pre:nth-child(' + (i)+')').addClass('cm-curline');
	$('#codeRes').append("line: " + (i) + "\n");
}

function canExecNextCmd()
{
	return false;
}