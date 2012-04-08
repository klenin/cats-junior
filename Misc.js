function generateTabs(tabsNum)
{
	var str = '';
	for (var i = 0; i < tabsNum; ++i)
		str += '\t';
	return str;
}

function test1()
{
	return true;
}

function test2()
{
	return false;
}

var testFunctions = ['test1', 'test2'];
var testFunctionsDict = {'test1': test1, 'test2': test2};
