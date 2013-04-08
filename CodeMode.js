define('CodeMode', ['Env'], function(){
	function outf(text)
	{
		text = text.replace(/</g, '&lt;');
		$('#cons' + getCurProblem()).append(text);
	}

	function getCurBlock()
	{
		var problem = getCurProblem();
		if(!finalcode[problem]){
			return;
		}
		var scope = finalcode[problem].compiled.scopes[$scope[problem]].scopename;
		return eval('$loc[' + problem + '].' + scope + '.stack[$loc[' + problem + '].' + scope + '.stack.length - 1].blk');
	}

	function getScope()
	{
		var problem = getCurProblem();
		if(!finalcode[problem]){
			return;
		}
		return finalcode[problem].compiled.scopes[$scope[problem]];
	}

	function calculateExpression(expression)
	{
		if (expression._astname == 'Name')
		{
			var result = undefined;
			var problem = getCurProblem();
			if(!finalcode[problem]){
				return;
			}
			if ($scope[problem] != undefined && $loc[problem] != undefined)
			{
				var scope = finalcode[problem].compiled.scopes[$scope[problem]].scopename;
				var t_scope = $scope[problem], 
					t_scopename = $scopename[problem], 
					t_scopestack = $scopestack[problem];
				var name = expression.id.v;
				//find name 
				while(eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].loc." + name) == undefined
					&& eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].parentStack") != undefined)
				{
					t_scope = eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].parent");
					var nm = t_scopename;
					t_scopename = eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].parentName");
					t_scopestack = eval("$loc[" + problem + "]." + nm + ".stack[" + t_scopestack + "].parentStack");
				}
				result = eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].loc." + name) !== undefined ?
							eval("$loc[" + problem + "]." + t_scopename + ".stack[" + t_scopestack + "].loc." + name):
							Sk.misceval.loadname(name, $gbl[problem], 1);
			}
			return result;
		}
		if (expression._astname == 'Num')
			return expression.n;
		if (expression._astname == 'BinOp')
		{
			var a = calculateExpression(expression.left);
			var b = calculateExpression(expression.right);
			return Sk.abstr.boNumPromote_[expression.op.prototype._astname](a, b);
		}
		if (expression._astname == 'UnaryOp')
		{
			var v = calculateExpression(expression.operand);
			var op = expression.op.prototype._astname;
		    if (op === "USub") return -v;
	        if (op === "UAdd") return v;
	        if (op === "Invert") return ~v;
		}
	}

	function calculateValue(source)
	{
		var filename = '<stdin>.py'
		var cst = Sk.parse(filename, source);
	    var ast = Sk.astFromParse(cst, filename);
		var st = Sk.symboltable(ast, filename);
		if (!(ast.body && ast.body.length == 1))
			return 'Invalid expression';
	    var expr = ast.body[0];
		if (expr._astname != 'Expr')
			return 'Invalid expression';
		return calculateExpression(expr.value);
	}
});

