/** @param {...*} x */
var out;

/**
 * @constructor
 * @param {string} filename
 * @param {SymbolTable} st
 * @param {number} flags
 * @param {string=} sourceCodeForAnnotation used to add original source to listing if desired
 */
function Compiler(filename, st, flags, sourceCodeForAnnotation)
{
    this.filename = filename;
    this.st = st;
    this.flags = flags;
    this.interactive = false;
    this.nestlevel = 0;

    this.u = null;
    this.stack = [];

    this.result = [];

    this.gensymcount = 0;

    this.allUnits = [];

    this.source = sourceCodeForAnnotation ? sourceCodeForAnnotation.split("\n") : false;
}

/**
 * @constructor
 *
 * Stuff that changes on entry/exit of code blocks. must be saved and restored
 * when returning to a block.
 *
 * Corresponds to the body of a module, class, or function.
 */

function CompilerUnit()
{
    this.ste = null;
    this.name = null;

    this.private_ = null;
    this.firstlineno = 0;
    this.lineno = 0;
    this.linenoSet = false;
    this.localnames = [];

    this.blocknum = 0;
    this.blocks = [];
    this.curblock = 0;

    this.scopename = null;

    this.prefixCode = '';
    this.varDeclsCode = '';
    this.switchCode = '';
    this.suffixCode = '';

    // stack of where to go on a break
    this.breakBlocks = [];
    // stack of where to go on a continue
    this.continueBlocks = [];
    this.exceptBlocks = [];
    this.finallyBlocks = [];
}

Compiler.prototype.getCurrentLevel = function(scope)
{
	var scopename = scope != undefined ? scope : this.u.scopename;
	var lastIndex = eval() - 1;
	return "$loc[" + Sk.problem + "]." + scopename + ".stack[$loc[" + Sk.problem + "]." + scopename + ".stack.length - 1]";
}

Compiler.prototype.getStack = function(scope)
{
	return '$loc[' + Sk.problem + '].' + (scope != undefined ? scope : this.u.scopename) + '.stack';
}


CompilerUnit.prototype.activateScope = function()
{
    var self = this;

    out = function() {
        var b = self.blocks[self.curblock];
        for (var i = 0; i < arguments.length; ++i)
            b.push(arguments[i]);
    };
};

Compiler.prototype.getSourceLine = function(lineno)
{
    goog.asserts.assert(this.source);
    return this.source[lineno - 1];
};

Compiler.prototype.annotateSource = function(ast)
{
    if (this.source)
    {
        var lineno = ast.lineno;
        var col_offset = ast.col_offset;
        out("\n//\n// line ", lineno, ":\n// ", this.getSourceLine(lineno), "\n// ");
        for (var i = 0; i < col_offset; ++i) out(" ");
        out("^\n//\n");
		this.u.blocks[this.u.curblock].lineno = lineno - 1;
    }
};

Compiler.prototype.gensym = function(hint)
{
    hint = hint || '';
    hint =  this.getCurrentLevel() + '.loc.' + hint;
    hint += this.gensymcount++;
    return hint;
};

Compiler.prototype.niceName = function(roughName)
{
    return this.gensym(roughName.replace("<", "").replace(">", "").replace(" ", "_"));
}

var reservedWords_ = { 'abstract': true, 'as': true, 'boolean': true,
    'break': true, 'byte': true, 'case': true, 'catch': true, 'char': true,
    'class': true, 'continue': true, 'const': true, 'debugger': true,
    'default': true, 'delete': true, 'do': true, 'double': true, 'else': true,
    'enum': true, 'export': true, 'extends': true, 'false': true,
    'final': true, 'finally': true, 'float': true, 'for': true,
    'function': true, 'goto': true, 'if': true, 'implements': true,
    'import': true, 'in': true, 'instanceof': true, 'int': true,
    'interface': true, 'is': true, 'long': true, 'namespace': true,
    'native': true, 'new': true, 'null': true, 'package': true,
    'private': true, 'protected': true, 'public': true, 'return': true,
    'short': true, 'static': true, 'super': true, 'switch': true,
    'synchronized': true, 'this': true, 'throw': true, 'throws': true,
    'transient': true, 'true': true, 'try': true, 'typeof': true, 'use': true,
    'var': true, 'void': true, 'volatile': true, 'while': true, 'with': true
};

function fixReservedWords(name)
{
    if (reservedWords_[name] !== true)
        return name;
    return name + "_$rw$";
}

function mangleName(priv, ident)
{
    var name = ident.v;
    if (priv === null || name === null || name.charAt(0) !== '_' || name.charAt(1) !== '_')
        return ident;
    // don't mangle __id__
    if (name.charAt(name.length - 1) === '_' && name.charAt(name.length - 2) === '_')
        return ident;
    // don't mangle classes that are all _ (obscure much?)
    if (priv.v.replace(/_/g, '') === '')
        return ident;
    priv = priv.v.replace(/^_*/, '');
    return '_' + priv + name;
}

/**
 * @param {string} hint basename for gensym
 * @param {...*} rest
 */
Compiler.prototype._gr = function(hint, rest)
{
    var v = this.gensym(hint);
    out(v, " = ");
    for (var i = 1; i < arguments.length; ++i)
    {
        out(arguments[i]);
    }
    out(";");
    return v;
};

Compiler.prototype._gr_ = function(c, hint, rest)
{
    var v = this.gensym(hint);
	out("if(eval(" + c + ") != undefined){");
	out('$loc[' + Sk.problem + '].parent = $scope[' + Sk.problem + '];\n');
	out('$loc[' + Sk.problem + '].parentName = $scopename[' + Sk.problem + '];\n');
	out('$loc[' + Sk.problem + '].parentStack = $scopestack[' + Sk.problem + '];\n');
	out('$loc[' + Sk.problem + '].call = "', v, '";\n');
	out('}\n');
	out('else $expr[' + Sk.problem + '] = 1;\n')
    out(v, " = ");
	for (var i = 2; i < arguments.length - 1; ++i)
        out(arguments[i]);
	out(");\n");
    return v;
};

Compiler.prototype._jumpfalse = function(test, block, e)
{
    var cond = this._gr('jfalse', "(", test, " === false || !Sk.misceval.isTrue(", test, "))");
    out("if(", cond, "){/*test failed */" + this.getCurrentLevel() + ".blk = ", block, ";",
		(e != undefined ? ("$expr[" + Sk.problem + "] = " + e + ";") : "" ), "break;}");
};

Compiler.prototype._jumpundef = function(test, block, e)
{
    out("if(", test, " === undefined){" + this.getCurrentLevel() + ".blk = ", block, ";",
		(e != undefined ? ("$expr[" + Sk.problem + "] = " + e + ";") : "" ), "break;}");
};

Compiler.prototype._jumptrue = function(test, block)
{
    var cond = this._gr('jtrue', "(", test, " === true || Sk.misceval.isTrue(", test, "))");
    out("if(", cond, "){/*test passed */" + this.getCurrentLevel() + ".blk = ", block, ";break;}");
};

Compiler.prototype._jump = function(block, expr)
{
    out(this.getCurrentLevel() + ".blk = ", block, ";", (expr != undefined ? ("$expr[" + Sk.problem + "] = " + expr + ";") : ""), "/* jump */break;");
};

Compiler.prototype.ctupleorlist = function(e, data, tuporlist)
{
    goog.asserts.assert(tuporlist === 'tuple' || tuporlist === 'list');
    if (e.ctx === Store)
    {
        for (var i = 0; i < e.elts.length; ++i)
        {
            this.vexpr(e.elts[i], "Sk.abstr.objectGetItem(" + data + ", " + i + ")");
        }
    }
    else if (e.ctx === Load)
    {
        var items = [];
        for (var i = 0; i < e.elts.length; ++i)
        {
            items.push(this._gr('elem', this.vexpr(e.elts[i])));
        }
        return this._gr('load'+tuporlist, "new Sk.builtins['", tuporlist, "']([", items, "])");
    }
};

Compiler.prototype.cdict = function(e)
{
    goog.asserts.assert(e.values.length === e.keys.length);
    var items = [];
    for (var i = 0; i < e.values.length; ++i)
    {
        var v = this.vexpr(e.values[i]); // "backwards" to match order in cpy
        items.push(this.vexpr(e.keys[i]));
        items.push(v);
    }
    return this._gr('loaddict', "new Sk.builtins['dict']([", items, "])");
};

Compiler.prototype.clistcompgen = function(tmpname, generators, genIndex, elt)
{
    var start = this.newBlock('list gen start');
    var skip = this.newBlock('list gen skip');
    var anchor = this.newBlock('list gen anchor');

    var l = generators[genIndex];
    var toiter = this.vexpr(l.iter);
    var iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
    this._jump(start);
	this.u.blocks[this.u.curblock].expr = 1;
    this.setBlock(start);
	this.u.blocks[this.u.curblock].expr = 1;

    // load targets
    var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
    this._jumpundef(nexti, anchor); // todo; this should be handled by StopIteration
    var target = this.vexpr(l.target, nexti);

    var n = l.ifs.length;
    for (var i = 0; i < n; ++i)
    {
        var ifres = this.vexpr(l.ifs[i]);
        this._jumpfalse(ifres, start);
    }

    if (++genIndex < generators.length)
    {
        this.clistcompgen(tmpname, generators, genIndex, elt);
    }

    if (genIndex >= generators.length)
    {
        var velt = this.vexpr(elt);
        out(tmpname, ".v.push(", velt, ");"); // todo;
        this._jump(skip);
        this.setBlock(skip);
		this.u.blocks[this.u.curblock].expr = 1;

    }

    this._jump(start);

    this.setBlock(anchor);
	this.u.blocks[this.u.curblock].expr = 1;

    return tmpname;
};

Compiler.prototype.clistcomp = function(e)
{
    goog.asserts.assert(e instanceof ListComp);
    var tmp = this._gr("_compr", "new Sk.builtins['list']([])"); // note: _ is impt. for hack in name mangling (same as cpy)
    return this.clistcompgen(tmp, e.generators, 0, e.elt);
};

Compiler.prototype.cyield = function(e)
{
    if (this.u.ste.blockType !== FunctionBlock)
        throw new SyntaxError("'yield' outside function");
    var val = 'null';
    if (e.value)
        val = this.vexpr(e.value);
    var nextBlock = this.newBlock('after yield');
    // return a pair: resume target block and yielded value
    out("return [/*resume*/", nextBlock, ",/*ret*/", val, "];");
    this.setBlock(nextBlock);
    return '$gen.gi$sentvalue'; // will either be null if none sent, or the value from gen.send(value)
};

Compiler.prototype.ccompare = function(e)
{
    goog.asserts.assert(e.ops.length === e.comparators.length);
    var cur = this.vexpr(e.left);
//	this.u.blocks[this.u.curblock].expr = 1;
    var n = e.ops.length;
    var done = this.newBlock("done");
    var fres = this._gr('compareres', 'null');

    for (var i = 0; i < n; ++i)
    {
        var rhs = this.vexpr(e.comparators[i]);
        var res = this._gr('compare', "Sk.misceval.richCompareBool(", cur, ",", rhs, ",'", e.ops[i].prototype._astname, "')");
        out(fres, '=', res, ';');
        this._jumpfalse(res, done);
        cur = rhs;
		this.u.blocks[this.u.curblock].expr = 1;
    }
    this._jump(done);
    this.setBlock(done);
	this.u.blocks[this.u.curblock].expr = 1;
    return fres;
};

Compiler.prototype.ccall = function(e)
{
    var func = this.vexpr(e.func, undefined, undefined, undefined, true);
    var args = this.vseqexpr(e.args);
    //print(JSON.stringify(e, null, 2));
    if (e.keywords.length > 0 || e.starargs || e.kwargs)
    {
        var kwarray = [];
        for (var i = 0; i < e.keywords.length; ++i)
        {
            kwarray.push("'" + e.keywords[i].arg.v + "'");
            kwarray.push(this.vexpr(e.keywords[i].value));
        }
        var keywords = "[" + kwarray.join(",") + "]";
        var starargs = "undefined";
        var kwargs = "undefined";
        if (e.starargs)
            starargs = this.vexpr(e.starargs);
        if (e.kwargs)
            kwargs = this.vexpr(e.kwargs);
        return this._gr('call', "Sk.misceval.call(", func, "," , kwargs, ",", starargs, ",", keywords, args.length > 0 ? "," : "", args, ")");
    }
    else
    {
		block = this.newBlock();
		out(this.getCurrentLevel() + ".blk = ", block, ";\n"); //we don't need to break;
		var call;
		if (e.func._astname == "Attribute")
        {
			call = this._gr('call', "Sk.misceval.callsim(", func, args.length > 0 ? "," : "", args, ")");
			out("$expr[" + Sk.problem + "] = 1;\n");
        }
		else
		{
			c = '111';
			if (func.length)
			{
				c = func[1];
				func = func[0];
			}
			call = this._gr_(c, 'call', "Sk.misceval.callsim(", func, args.length > 0 ? "," : "", args, ")");
		}
		out("break;\n");
		this.setBlock(block);	
		this.u.blocks[this.u.curblock].lineno = e.lineno - 1;
		return call;
    }
};

Compiler.prototype.csimpleslice = function(s, ctx, obj, dataToStore)
{
    goog.asserts.assert(s.step === null);
    var lower = 'null', upper = 'null';
    if (s.lower)
        lower = this.vexpr(s.lower);
    if (s.upper)
        upper = this.vexpr(s.upper);

    // todo; don't require making a slice obj, and move logic into general sequence place
    switch (ctx)
    {
        case AugLoad:
        case Load:
            return this._gr("simpsliceload", "Sk.misceval.applySlice(", obj, ",", lower, ",", upper, ")");
        case AugStore:
        case Store:
            out("Sk.misceval.assignSlice(", obj, ",", lower, ",", upper, ",", dataToStore, ");");
            break;
        case Del:
            out("Sk.misceval.assignSlice(", obj, ",", lower, ",", upper, ",null);");
            break;
        case Param:
        default:
            goog.asserts.fail("invalid simple slice");
    }
};

Compiler.prototype.cslice = function(s, ctx, obj, dataToStore)
{
    goog.asserts.assert(s instanceof Slice);
    var low = s.lower ? this.vexpr(s.lower) : 'null';
    var high = s.upper ? this.vexpr(s.upper) : 'null';
    var step = s.step ? this.vexpr(s.step) : 'null';
    return this._gr('slice', "new Sk.builtins['slice'](", low, ",", high, ",", step, ")");
};

Compiler.prototype.vslice = function(s, ctx, obj, dataToStore)
{
    var kindname = null;
    var subs;
    switch (s.constructor)
    {
        case Index:
            kindname = "index";
            subs = this.vexpr(s.value);
            break;
        case Slice:
            if (!s.step)
                return this.csimpleslice(s, ctx, obj, dataToStore);
            if (ctx !== AugStore)
                subs = this.cslice(s, ctx, obj, dataToStore);
            break;
        case Ellipsis:
        case ExtSlice:
            goog.asserts.fail("todo;");
            break;
        default:
            goog.asserts.fail("invalid subscript kind");
    }
    return this.chandlesubscr(kindname, ctx, obj, subs, dataToStore);
};

Compiler.prototype.chandlesubscr = function(kindname, ctx, obj, subs, data)
{
    if (ctx === Load || ctx === AugLoad)
        return this._gr('lsubscr', "Sk.abstr.objectGetItem(", obj, ",", subs, ")");
    else if (ctx === Store || ctx === AugStore)
        out("Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ");");
    else if (ctx === Del)
        out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
    else
        goog.asserts.fail("handlesubscr fail");
};

Compiler.prototype.cboolop = function(e)
{
    goog.asserts.assert(e instanceof BoolOp);
	this.u.blocks[this.u.curblock].expr = 1;
    var jtype;
    var ifFailed;
    if (e.op === And)
        jtype = this._jumpfalse;
    else
        jtype = this._jumptrue;
    var end = this.newBlock('end of boolop');
    var s = e.values;
    var n = s.length;
    var retval;
    for (var i = 0; i < n; ++i)
    {
        var expres = this.vexpr(s[i])
        if (i === 0)
        {
            retval = this._gr('boolopsucc', expres);
        }
        out(retval, "=", expres, ";");
        jtype.call(this, expres, end);
    }
    this._jump(end);
    this.setBlock(end);
	this.u.blocks[this.u.curblock].expr = 1;
    return retval;
};


/**
 *
 * compiles an expression. to 'return' something, it'll gensym a var and store
 * into that var so that the calling code doesn't have avoid just pasting the
 * returned name.
 *
 * @param {Object} e
 * @param {string=} data data to store in a store operation
 * @param {Object=} augstoreval value to store to for an aug operation (not
 * vexpr'd yet)
 */
Compiler.prototype.vexpr = function(e, data, augstoreval, arg1, arg2)
{
    if (e.lineno > this.u.lineno)
    {
        this.u.lineno = e.lineno;
        this.u.linenoSet = false;
    }
    //this.annotateSource(e);
    switch (e.constructor)
    {
        case BoolOp:
            return this.cboolop(e);
        case BinOp:
            return this._gr('binop', "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op.prototype._astname, "')");
        case UnaryOp:
            return this._gr('unaryop', "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op.prototype._astname, "')");
        case Lambda:
            return this.clambda(e);
        case IfExp:
            return this.cifexp(e);
        case Dict:
            return this.cdict(e);
        case ListComp:
            return this.clistcomp(e);
        case GeneratorExp:
            return this.cgenexp(e);
        case Yield:
            return this.cyield(e);
        case Compare:
            return this.ccompare(e);
        case Call:
            return this.ccall(e);
        case Num:
            if (typeof e.n === "number")
                return e.n;
            else if (e.n instanceof Sk.builtin.lng)
                return "Sk.longFromStr('" + e.n.tp$str().v + "')";
            goog.asserts.fail("unhandled Num type");
        case Str:
            return this._gr('str', "new Sk.builtins['str'](", e.s['$r']().v, ")");
        case Attribute:
            var val;
            if (e.ctx !== AugStore)
                val = this.vexpr(e.value);
            switch (e.ctx)
            {
                case AugLoad:
                case Load:
                    return this._gr("lattr", "Sk.abstr.gattr(", val, ",", e.attr['$r']().v, ")");
                case AugStore:
                    out("if(", data, "!==undefined){"); // special case to avoid re-store if inplace worked
                    val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                    out("Sk.abstr.sattr(", val, ",", e.attr['$r']().v, ",", data, ");");
                    out("}");
                    break;
                case Store:
                    out("Sk.abstr.sattr(", val, ",", e.attr['$r']().v, ",", data, ");");
                    break;
                case Del:
                    goog.asserts.fail("todo;");
                    break;
                case Param:
                default:
                    goog.asserts.fail("invalid attribute expression");
            }
            break;
        case Subscript:
            var val;
            switch (e.ctx)
            {
                case AugLoad:
                case Load:
                case Store:
                case Del:
                    return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                case AugStore:
                    out("if(", data, "!==undefined){"); // special case to avoid re-store if inplace worked
                    val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                    this.vslice(e.slice, e.ctx, val, data);
                    out("}");
                    break;
                case Param:
                default:
                    goog.asserts.fail("invalid subscript expression");
            }
            break;
        case Name:
            return this.nameop(e.id, e.ctx, data, arg1, arg2);
        case List:
            return this.ctupleorlist(e, data, 'list');
        case Tuple:
            return this.ctupleorlist(e, data, 'tuple');
        default:
            goog.asserts.fail("unhandled case in vexpr");
    }
	//if (parent)
		//out('$expr = 0;');
};

/**
 * @param {Array.<Object>} exprs
 * @param {Array.<string>=} data
 */
Compiler.prototype.vseqexpr = function(exprs, data)
{
    goog.asserts.assert(data === undefined || exprs.length === data.length);
    var ret = [];
    for (var i = 0; i < exprs.length; ++i)
        ret.push(this.vexpr(exprs[i], data === undefined ? undefined : data[i]));
    return ret;
};

Compiler.prototype.caugassign = function(s)
{
    goog.asserts.assert(s instanceof AugAssign);
    var e = s.target;
    switch (e.constructor)
    {
        case Attribute:
            var auge = new Attribute(e.value, e.attr, AugLoad, e.lineno, e.col_offset);
            var aug = this.vexpr(auge);
            var val = this.vexpr(s.value);
            var res = this._gr('inplbinopattr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
            auge.ctx = AugStore;
            return this.vexpr(auge, res, e.value)
        case Subscript:
            var auge = new Subscript(e.value, e.slice, AugLoad, e.lineno, e.col_offset);
            var aug = this.vexpr(auge);
            var val = this.vexpr(s.value);
            var res = this._gr('inplbinopsubscr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
            auge.ctx = AugStore;
            return this.vexpr(auge, res, e.value)
        case Name:
            var to = this.nameop(e.id, Load);
            var val = this.vexpr(s.value);
            var res = this._gr('inplbinop', "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op.prototype._astname, "')");
            return this.nameop(e.id, Store, res);
        default:
            goog.asserts.fail("unhandled case in augassign");
    }
};

/**
 * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
 */
Compiler.prototype.exprConstant = function(e)
{
    switch (e.constructor)
    {
        case Num:
            return Sk.misceval.isTrue(e.n);
        case Str:
            return Sk.misceval.isTrue(e.s);
        case Name:
            // todo; do __debug__ test here if opt
        default:
            return -1;
    }
};

Compiler.prototype.newBlock = function(name)
{
	if (this.u.blocknum)
		out ('\n');
    var ret = this.u.blocknum++;
    this.u.blocks[ret] = [];
    this.u.blocks[ret]._name = name || '<unnamed>';
    return ret;
};
Compiler.prototype.setBlock = function(n, lineno)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.curblock = n;
};

Compiler.prototype.pushBreakBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.breakBlocks.push(n);
};
Compiler.prototype.popBreakBlock = function()
{
    this.u.breakBlocks.pop();
};

Compiler.prototype.pushContinueBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.continueBlocks.push(n);
};
Compiler.prototype.popContinueBlock = function()
{
    this.u.continueBlocks.pop();
};

Compiler.prototype.pushExceptBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.exceptBlocks.push(n);
};
Compiler.prototype.popExceptBlock = function()
{
    this.u.exceptBlocks.pop();
};

Compiler.prototype.pushFinallyBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.finallyBlocks.push(n);
};
Compiler.prototype.popFinallyBlock = function()
{
    this.u.finallyBlocks.pop();
};

Compiler.prototype.setupExcept = function(eb)
{
    out("$exc.push(", eb, ");try{");
    //this.pushExceptBlock(eb);
};

Compiler.prototype.endExcept = function()
{
    out("$exc.pop();}catch($err){");
    out("$blk=$exc.pop();");
    out("break;}");
};

Compiler.prototype.outputLocals = function(unit)
{
    var have = {};
    //print("args", unit.name.v, JSON.stringify(unit.argnames));
    for (var i = 0; unit.argnames && i < unit.argnames.length; ++i)
        have[unit.argnames[i]] = true;
    unit.localnames.sort();
    var output = [];
    for (var i = 0; i < unit.localnames.length; ++i)
    {
        var name = unit.localnames[i];
        if (have[name] === undefined)
        {
            output.push(name);
            have[name] = true;
        }
    }
    if (output.length > 0)
        return output.join(",") + "; /* locals */";
    return "";
};

Compiler.prototype.outputAllUnits = function()
{
    var ret = '';
	for (var j = this.allUnits.length - 1; j > 0; --j)
	{
		var unit = this.allUnits[j];
        ret += unit.prefixCode;
        ret += unit.varDeclsCode;
		ret += '});';
	}
	ret += 'switch($scope[' + Sk.problem + ']){\n'
    for (var j = 0; j < this.allUnits.length; ++j)
    {
    	var unit = this.allUnits[j];
     	ret += 'case ' + j + ':\n' ;
        ret += unit.switchCode;
        var blocks = unit.blocks;
        for (var i = 0; i < blocks.length; ++i)
        {
            ret += "case " + i + ": /* --- " + blocks[i]._name + " --- */";
            ret += blocks[i].join('');

            ret += "goog.asserts.fail('unterminated block');\n";
        }
        ret += unit.suffixCode;
		ret += 'break;\n';
    }
	ret += '}';
    return ret;
};

Compiler.prototype.cif = function(s)
{
    goog.asserts.assert(s instanceof If_);
    var constant = this.exprConstant(s.test);
	var end = this.newBlock('end of if');
    if (constant === 0)
    {
        if (s.orelse) 
            this.vseqstmt(s.orelse);
    }
    else if (constant === 1)
    {
        this.vseqstmt(s.body);
    }
    else
    {
        var test = this.vexpr(s.test, null, null, this);
		this.u.blocks[this.u.curblock].lineno = this.u.lineno - 1;
		this.u.blocks[this.u.curblock].expr = 0;
		var next = this.newBlock('next branch of if');
		var elseBlock = undefined; 
		if (s.orelse != undefined && s.orelse.length)
			elseBlock = this.newBlock('alternative branch of if');
		this._jumptrue(test, next);
		if (elseBlock != undefined)
			this._jumpfalse(test, elseBlock);
		else
		{
			this._jump(end, 1);
		}
		this.u.blocks[this.u.curblock].lineno = this.u.lineno - 1;
		this.setBlock(next);
		this.vseqstmt(s.body);

        this._jump(end, 1);

		if (elseBlock != undefined)
		{
		    this.setBlock(elseBlock);
		    if (s.orelse)
		        this.vseqstmt(s.orelse);
		    this._jump(end, 1);
		}
        
    }
    this.setBlock(end);
};

Compiler.prototype.cwhile = function(s)
{
    var constant = this.exprConstant(s.test);
    if (constant === 0)
    {
        if (s.orelse)
            this.vseqstmt(s.orelse);
    }
    else
    {
    	var header = this.u.curblock;
    	var test = this.vexpr(s.test);
		this.u.blocks[this.u.curblock].lineno = this.u.lineno - 1;
		this.u.blocks[this.u.curblock].expr = 0;

        var next = this.newBlock('after while');
        var orelse = s.orelse.length > 0 ? this.newBlock('while orelse') : null;
        var body = this.newBlock('while body');

        this._jumpfalse(test, orelse ? orelse : next, 1);
        this._jump(body);

        this.pushBreakBlock(next);
        this.pushContinueBlock(header);

		this.u.blocks[this.u.curblock].lineno = this.u.lineno - 1;

        this.setBlock(body);
        this.vseqstmt(s.body);
        this._jump(header);

        this.popContinueBlock();
        this.popBreakBlock();

        if (s.orelse.length > 0)
        {
            this.setBlock(orelse);
            this.vseqstmt(s.orelse);
        }

        this.setBlock(next);
		this.u.blocks[this.u.curblock].lineno = s.lineno - 1;
    }
};

Compiler.prototype.cfor = function(s)
{
	var line = this.u.lineno - 1;
    var start = this.newBlock('for start');
    var end = this.newBlock('for end');

    this.pushBreakBlock(end);
    this.pushContinueBlock(start);

    // get the iterator
    var toiter = this.vexpr(s.iter);
	this.u.blocks[this.u.curblock].expr = 1;

    var iter;
    if (this.u.ste.generator)
    {
        // if we're in a generator, we have to store the iterator to a local
        // so it's preserved (as we cross blocks here and assume it survives)
        iter = this.getCurrentLevel() + '.loc.' + + this.gensym("iter");
        out(iter, "=Sk.abstr.iter(", toiter, ");");
    }
    else
        iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
	
    this._jump(start);
    this.setBlock(start);
    // load targets
    var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");

    var cleanup = this.newBlock('for cleanup');
    this._jumpundef(nexti, cleanup, 1); // todo; this should be handled by StopIteration
    var target = this.vexpr(s.target, nexti);
	this.u.blocks[this.u.curblock].lineno = this.u.lineno - 1;

    var body = this.newBlock('for body');
	this._jump(body);
	this.setBlock(body);
	this.u.blocks[this.u.curblock].expr = 0;
    // execute body
    this.vseqstmt(s.body);
    
    // jump to top of loop
    this._jump(start);

    this.setBlock(cleanup);

    this.popContinueBlock();
    this.popBreakBlock();

    this.vseqstmt(s.orelse);
	this._jump(end, !s.orelse || s.orelse && !s.orelse.length);
    this.setBlock(end);
	//this.u.blocks[this.u.curblock].lineno = line;

};

Compiler.prototype.craise = function(s)
{
    if (s.type.id.v === "StopIteration")
    {
        // currently, we only handle StopIteration, and all it does it return
        // undefined which is what our iterator protocol requires.
        //
        // totally hacky, but good enough for now.
        out("return undefined;");
    }
    else
    {
        // todo;
        var inst = '';
        if (s.inst)
            inst = this.vexpr(s.inst);
        out("throw new ", this.vexpr(s.type), "(", inst, ");");
    }
};

Compiler.prototype.ctryexcept = function(s)
{
    var except = this.newBlock("except");
    var orelse = this.newBlock("orelse");
    var end = this.newBlock("end");

    this.setupExcept(except);

    this.vseqstmt(s.body);

    this.endExcept();

    this._jump(orelse);

    this.setBlock(except);
    var n = s.handlers.length;
    for (var i = 0; i < n; ++i)
    {
        var handler = s.handlers[i];
        if (handler.type && i < n - 1)
            throw new SyntaxError("default 'except:' must be last");
        except = this.newBlock("except_" + i + "_");
        if (handler.type)
        {
            // todo; not right at all
            this._jumpfalse(this.vexpr(handler.type), except);
        }
        // todo; name
        this.vseqstmt(handler.body);
    }

    this.setBlock(orelse);
    this.vseqstmt(s.orelse);
    this._jump(end);
    this.setBlock(end);
};

Compiler.prototype.ctryfinally = function(s)
{
    out("/*todo; tryfinally*/");
};

Compiler.prototype.cassert = function(s)
{
    /* todo; warnings method
    if (s.test instanceof Tuple && s.test.elts.length > 0)
        Sk.warn("assertion is always true, perhaps remove parentheses?");
    */

    var test = this.vexpr(s.test);
    var end = this.newBlock("end");
    this._jumptrue(test, end);
    // todo; exception handling
    // maybe replace with goog.asserts.fail?? or just an alert?
    out("throw new Sk.builtins.AssertionError(", s.msg ? this.vexpr(s.msg) : "", ");");
    this.setBlock(end);
};

Compiler.prototype.cimportas = function(name, asname, mod)
{
    var src = name.v;
    var dotLoc = src.indexOf(".");
    //print("src", src);
    //print("dotLoc", dotLoc);
    var cur = mod;
    if (dotLoc !== -1)
    {
        // if there's dots in the module name, __import__ will have returned
        // the top-level module. so, we need to extract the actual module by
        // getattr'ing up through the names, and then storing the leaf under
        // the name it was to be imported as.
        src = src.substr(dotLoc + 1);
        //print("src now", src);
        while (dotLoc !== -1)
        {
            dotLoc = src.indexOf(".");
            var attr = dotLoc !== -1 ? src.substr(0, dotLoc) : src;
            cur = this._gr('lattr', "Sk.abstr.gattr(", cur, ",'", attr, "')");
            src = src.substr(dotLoc + 1);
        }
    }
    return this.nameop(asname, Store, cur);
};

Compiler.prototype.cimport = function(s)
{
    var n = s.names.length;
    for (var i = 0; i < n; ++i)
    {
        var alias = s.names[i];
        var mod = this._gr('module', "Sk.builtin.__import__(", alias.name['$r']().v, ",$gbl[" + Sk.problem + "],$loc[" + Sk.problem + "],[])");

        if (alias.asname)
        {
            this.cimportas(alias.name, alias.asname, mod);
        }
        else
        {
            var tmp = alias.name;
            var lastDot = tmp.v.indexOf('.');
            if (lastDot !== -1)
                tmp = new Sk.builtin.str(tmp.v.substr(0, lastDot));
            this.nameop(tmp, Store, mod);
        }
    }
};

Compiler.prototype.cfromimport = function(s)
{
    var n = s.names.length;
    var names = [];
    for (var i = 0; i < n; ++i)
        names[i] = s.names[i].name['$r']().v;
    var mod = this._gr('module', "Sk.builtin.__import__(", s.module['$r']().v, ",$gbl[" + Sk.problem + "],$loc[" + Sk.problem + "],[", names, "])");
    for (var i = 0; i < n; ++i)
    {
        var alias = s.names[i];
        if (i === 0 && alias.name.v === "*")
        {
            goog.asserts.assert(n === 1);
            out("Sk.importStar(", mod, ");");
            return;
        }

        var got = this._gr('item', "Sk.abstr.gattr(", mod, ",", alias.name['$r']().v, ")");
        var storeName = alias.name;
        if (alias.asname)
            storeName = alias.asname;
        this.nameop(storeName, Store, got);
    }
};

/**
 * builds a code object (js function) for various constructs. used by def,
 * lambda, generator expressions. it isn't used for class because it seemed
 * different enough.
 *
 * handles:
 * - setting up a new scope
 * - decorators (if any)
 * - defaults setup
 * - setup for cell and free vars
 * - setup and modification for generators
 *
 * @param {Object} n ast node to build for
 * @param {Sk.builtin.str} coname name of code object to build
 * @param {Array} decorator_list ast of decorators if any
 * @param {arguments_} args arguments to function, if any
 * @param {Function} callback called after setup to do actual work of function
 *
 * @returns the name of the newly created function or generator object.
 *
 */
Compiler.prototype.buildcodeobj = function(n, coname, decorator_list, args, callback)
{
    var decos = [];
    var defaults = [];
    var vararg = null;
    var kwarg = null;

    // decorators and defaults have to be evaluated out here before we enter
    // the new scope. we output the defaults and attach them to this code
    // object, but only once we know the name of it (so we do it after we've
    // exited the scope near the end of this function).
    if (decorator_list)
        decos = this.vseqexpr(decorator_list);
    if (args && args.defaults)
        defaults = this.vseqexpr(args.defaults);
    if (args && args.vararg)
        vararg = args.vararg;
    if (args && args.kwarg)
        kwarg = args.kwarg;

    //
    // enter the new scope, and create the first block
    //
    var parentScope;
    for (var i = 0; i < this.allUnits.length; ++i)
	{
		if (this.allUnits[i].scopename == this.u.scopename)
		{
			parentScope = i;
			break;
		}
	}
    var scopename = this.enterScope(coname, n, n.lineno);
	this.u.parentScope = parentScope;
    var isGenerator = this.u.ste.generator;
    var hasFree = this.u.ste.hasFree;
    var hasCell = this.u.ste.childHasFree;

    var entryBlock = this.newBlock('codeobj entry');

    //
    // the header of the function, and arguments
    //
    this.u.prefixCode = "var " + scopename + "=(function " + /*this.niceName(coname.v)*/coname.v  + "$(";
    var funcArgs = [];
    if (isGenerator)
        funcArgs.push("$gen");
    else
    {
        if (kwarg)
            funcArgs.push("$kwa");
        for (var i = 0; args && i < args.args.length; ++i)
            funcArgs.push(this.nameop(args.args[i].id, Param));
    }
    /*if (hasFree)
        funcArgs.push("$free");*/
    this.u.prefixCode += funcArgs.join(",");
    this.u.prefixCode += "){";

    if (isGenerator) this.u.prefixCode += "\n// generator\n";
    if (hasFree) this.u.prefixCode += "\n// has free\n";
    if (hasCell) this.u.prefixCode += "\n// has cell\n";

    //
    // set up standard dicts/variables
    //
    var locals = "{}";
    if (isGenerator)
    {
        entryBlock = "$gen.gi$resumeat";
        locals = "$gen.gi$locals";
    }
    var cells = "";
    if (hasCell)
        cells = "," + this.getCurrentLevel() + ".cell={}";

    // note special usage of 'this' to avoid having to slice globals into
    // all function invocations in call
    this.u.varDeclsCode += this.getStack(scopename) + ".push({'loc': {}, 'param': {}, 'blk': " + entryBlock + " });"
	for (var i = 0; args && i < args.args.length; ++i)
	{
		this.u.varDeclsCode += this.nameop(args.args[i].id, Load, undefined, true) + " = " + 
			this.nameop(args.args[i].id, Param) + ";";
	}

	/*	out('$loc.parent = $scope;\n');
	out('$loc.parentName = $scopename;\n');
	out('$loc.parentStack = $scopestack;\n');
	out('$loc.call = ', v, ';\n')*/
	this.u.varDeclsCode += this.getCurrentLevel(scopename) + '.parent = $loc[' + Sk.problem + '].parent;\n'; 
	this.u.varDeclsCode += this.getCurrentLevel(scopename) + '.parentName =$loc[' + Sk.problem + '].parentName;\n'; 
	this.u.varDeclsCode += this.getCurrentLevel(scopename) + '.parentStack = $loc[' + Sk.problem + '].parentStack;\n'; 
	this.u.varDeclsCode += this.getCurrentLevel(scopename) +'.call = $loc[' + Sk.problem + '].call;\n'; 
	this.u.varDeclsCode += '$loc[' + Sk.problem + '].parent = undefined;\n';
	this.u.varDeclsCode += '$loc[' + Sk.problem + '].parentName = undefined;\n';
	this.u.varDeclsCode += '$loc[' + Sk.problem + '].parentStack = undefined;\n';
	this.u.varDeclsCode += '$loc[' + Sk.problem + '].call = undefined;\n';
	this.u.varDeclsCode += '$scope[' + Sk.problem + '] = ' + (this.allUnits.length - 1) + ';';
	this.u.varDeclsCode += '$scopename[' + Sk.problem + '] = "' + scopename + '";';
	this.u.varDeclsCode += '$scopestack[' + Sk.problem + '] = $loc[' + Sk.problem + '].' + scopename +'.stack.length - 1;';
	this.u.varDeclsCode += this.getCurrentLevel() + ".cell={};\n";
    //
    // copy all parameters that are also cells into the cells dict. this is so
    // they can be accessed correctly by nested scopes.
    //
    for (var i = 0; args && i < args.args.length; ++i)
    {
    	//
        var id = args.args[i].id;
        if (this.isCell(id))
            this.u.varDeclsCode += this.getCurrentLevel(scopename) + ".cell." + 
            	id.v + "=" + this.nameop(args.args[i].id, Load, undefined, true)+ ";\n";
    }

    //
    // initialize default arguments. we store the values of the defaults to
    // this code object as .$defaults just below after we exit this scope.
    //
    if (defaults.length > 0)
    {
        // defaults have to be "right justified" so if there's less defaults
        // than args we offset to make them match up (we don't need another
        // correlation in the ast)
        var offset = args.args.length - defaults.length;
        for (var i = 0; i < defaults.length; ++i)
        {
            var argname = this.nameop(args.args[i + offset].id, Param);
            this.u.varDeclsCode += "if(" + this.getCurrentLevel() + '.param.' + argname + "===undefined)" +
				this.getCurrentLevel() + '.param.' + argname  + " = $loc[" + Sk.problem + "]." + scopename + '.defaults[' + i + '];';
        }
    }

    //
    // initialize vararg, if any
    //
    if (vararg)
    {
        var start = funcArgs.length;
        this.u.varDeclsCode += vararg.v + "=new Sk.builtins['tuple'](Array.prototype.slice.call(arguments," + start + ")); /*vararg*/";
    }

    //
    // initialize kwarg, if any
    //
    if (kwarg)
    {
        this.u.varDeclsCode += kwarg.v + "=new Sk.builtins['dict']($kwa);";
    }

    //
    // finally, set up the block switch that the jump code expects
    //
    this.u.switchCode += "switch(" + this.getCurrentLevel(scopename) + ".blk){";
    this.u.suffixCode = "};";

    //
    // jump back to the handler so it can do the main actual work of the
    // function
    //
    callback.call(this, scopename);

    //
    // get a list of all the argument names (used to attach to the code
    // object, and also to allow us to declare only locals that aren't also
    // parameters).
    var argnames;
    if (args && args.args.length > 0)
    {
        var argnamesarr = [];
        for (var i = 0; i < args.args.length; ++i)
            argnamesarr.push(args.args[i].id.v);

        argnames = argnamesarr.join("', '");
        // store to unit so we know what local variables not to declare
        this.u.argnames = argnamesarr;
    }

    //
    // and exit the code object scope
    //
    this.exitScope();

    //
    // attach the default values we evaluated at the beginning to the code
    // object so that it can get at them to set any arguments that are left
    // unset.
    //
    if (defaults.length > 0)
    {
        out('$loc[' + Sk.problem + '].' + scopename + ".defaults=[", defaults.join(','), "];");
    }


    //
    // attach co_varnames (only the argument names) for keyword argument
    // binding.
    //
    if (argnames)
    {
        out(scopename, ".co_varnames=['", argnames, "'];");
    }

    //
    // attach flags
    //
    if (kwarg)
    {
        out(scopename, ".co_kwargs=1;");
    }

    //
    // build either a 'function' or 'generator'. the function is just a simple
    // constructor call. the generator is more complicated. it needs to make a
    // new generator every time it's called, so the thing that's returned is
    // actually a function that makes the generator (and passes arguments to
    // the function onwards to the generator). this should probably actually
    // be a function object, rather than a js function like it is now. we also
    // have to build the argument names to pass to the generator because it
    // needs to store all locals into itself so that they're maintained across
    // yields.
    //
    // todo; possibly this should be outside?
    // 
    var frees = "";
    /*if (hasFree)
    {
        frees = "," + this.getCurrentLevel() + ".cell";
        // if the scope we're in where we're defining this one has free
        // vars, they may also be cell vars, so we pass those to the
        // closure too.
        var containingHasFree = this.u.ste.hasFree;
        if (containingHasFree)
            frees += ",$free";
    }*/
    if (isGenerator)
        if (args && args.args.length > 0)
            return this._gr("gener", "(function(){var $origargs=Array.prototype.slice.call(arguments);return new Sk.builtins['generator'](", scopename, ",$gbl[" + Sk.problem + "],$origargs", frees, ");})");
        else
            return this._gr("gener", "(function(){return new Sk.builtins['generator'](", scopename, ",$gb[" + Sk.problem + "]l,[]", frees, ");})");
    else
        return this._gr("funcobj", "new Sk.builtins['function'](", scopename, ",$gbl[" + Sk.problem + "]", frees ,")");
};

Compiler.prototype.cfunction = function(s)
{
    goog.asserts.assert(s instanceof FunctionDef);
	this.u.blocks[this.u.curblock].expr = 1;
	this.u.blocks[this.u.curblock].funcdef = 1;
    var funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args, function(scopename)
    {
    	for (var i = 0; s.args && i < s.args.args.length; ++i)
		{
			out(this.nameop(s.args.args[i].id, Load) + " = " + 
				this.nameop(s.args.args[i].id, Load, undefined, true) + ";");
		}
    	this.u.blocks[this.u.curblock].lineno = s.lineno - 1;
        this.vseqstmt(s.body, true);
		if (s.body[s.body.length - 1]._astname != "Return")
		{
			out('eval(' + this.getCurrentLevel() + '.call + " = null;");\n'); //repeated code!!!!!
	        out("$scope[" + Sk.problem + "] = " + this.getCurrentLevel() + ".parent;\n"); 
			out("$scopename[" + Sk.problem + "] = " + this.getCurrentLevel() + ".parentName;\n"); 
			out("$scopestack[" + Sk.problem + "] = " + this.getCurrentLevel() + ".parentStack;\n");
			out('eval("', this.getStack(), '.pop();");\n'); 
		}
        out("break;\n")
    });
    this.nameop(s.name, Store, funcorgen, undefined, true);
};

Compiler.prototype.clambda = function(e)
{
    goog.asserts.assert(e instanceof Lambda);
    var func = this.buildcodeobj(e, new Sk.builtin.str("<lambda>"), null, e.args, function(scopename)
            {
                var val = this.vexpr(e.body);
                out("return ", val, ";");
            });
    return func;
};

Compiler.prototype.cifexp = function(e)
{
    var next = this.newBlock('next of ifexp');
    var end = this.newBlock('end of ifexp');
    var ret = this._gr('res', 'null');

    var test = this.vexpr(e.test);
    this._jumpfalse(test, next, 1);

    out(ret, '=', this.vexpr(e.body), ';');
    this._jump(end, 1);

    this.setBlock(next);
    out(ret, '=', this.vexpr(e.orelse), ';');
    this._jump(end, 1);

    this.setBlock(end);
    return ret;
};

Compiler.prototype.cgenexpgen = function(generators, genIndex, elt)
{
    var start = this.newBlock('start for ' + genIndex);
    var skip = this.newBlock('skip for ' + genIndex);
    var ifCleanup = this.newBlock('if cleanup for ' + genIndex);
    var end = this.newBlock('end for ' + genIndex);

    var ge = generators[genIndex];

    var iter;
    if (genIndex === 0)
    {
        // the outer most iterator is evaluated in the scope outside so we
        // have to evaluate it outside and store it into the generator as a
        // local, which we retrieve here.
        iter = this.getCurrentLevel() + '.loc.' + "$iter0";
    }
    else
    {
        var toiter = this.vexpr(ge.iter);
        iter = this.getCurrentLevel() + '.loc.' + this.gensym("iter");
        out(iter, "=", "Sk.abstr.iter(", toiter, ");");
    }
    this._jump(start);
    this.setBlock(start);

    // load targets
    var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
    this._jumpundef(nexti, end); // todo; this should be handled by StopIteration
    var target = this.vexpr(ge.target, nexti);

    var n = ge.ifs.length;
    for (var i = 0; i < n; ++i)
    {
        var ifres = this.vexpr(ge.ifs[i]);
        this._jumpfalse(ifres, start);
    }

    if (++genIndex < generators.length)
    {
        this.cgenexpgen(generators, genIndex, elt);
    }

    if (genIndex >= generators.length)
    {
        var velt = this.vexpr(elt);
        out("return [", skip, "/*resume*/,", velt, "/*ret*/];");
        this.setBlock(skip);
    }

    this._jump(start);

    this.setBlock(end);

    if (genIndex === 1)
        out("return null;");
};

Compiler.prototype.cgenexp = function(e)
{
    var gen = this.buildcodeobj(e, new Sk.builtin.str("<genexpr>"), null, null, function(scopename)
            {
                this.cgenexpgen(e.generators, 0, e.elt);
            });

    // call the generator maker to get the generator. this is kind of dumb,
    // but the code builder builds a wrapper that makes generators for normal
    // function generators, so we just do it outside (even just new'ing it
    // inline would be fine).
    var gener = this._gr("gener", gen, "()");
    // stuff the outermost iterator into the generator after evaluating it
    // outside of the function. it's retrieved by the fixed name above.
    out(gener, ".gi$locals.$iter0=Sk.abstr.iter(", this.vexpr(e.generators[0].iter), ");");
    return gener;
};



Compiler.prototype.cclass = function(s)
{
    goog.asserts.assert(s instanceof ClassDef);
    var decos = s.decorator_list;

    // decorators and bases need to be eval'd out here
    //this.vseqexpr(decos);
    
    var bases = this.vseqexpr(s.bases);

    var scopename = this.enterScope(s.name, s, s.lineno);
    var entryBlock = this.newBlock('class entry');

    this.u.prefixCode = "var " + scopename + "=(function $" + s.name.v + "$class_outer($globals,$locals,$rest){var $gbl[" + Sk.problem + "]=$globals,$loc[" + Sk.problem + "]=$locals;";
    this.u.switchCode += "return(function " + s.name.v + "(){";
    this.u.switchCode += "var $blk=" + entryBlock + ",$exc=[];while(true){switch($blk){";
    this.u.suffixCode = "}break;}}).apply(null,$rest);});";

    this.u.private_ = s.name;
    
    this.cbody(s.body);
    out("break;");

    // build class

    // apply decorators

    this.exitScope();

    // todo; metaclass
    var wrapped = this._gr("built", "Sk.misceval.buildClass($gbl[" + Sk.problem + "],", scopename, ",", s.name['$r']().v, ",[", bases, "])");

    // store our new class under the right name
    this.nameop(s.name, Store, wrapped);
};

Compiler.prototype.ccontinue = function(s)
{
    if (this.u.continueBlocks.length === 0)
        throw new SyntaxError("'continue' outside loop");
    // todo; continue out of exception blocks
    this._jump(this.u.continueBlocks[this.u.continueBlocks.length - 1]);
};

/**
 * compiles a statement
 */
Compiler.prototype.vstmt = function(s)
{
    this.u.lineno = s.lineno;
    this.u.linenoSet = false;

    this.annotateSource(s);

    switch (s.constructor)
    {
        case FunctionDef:
            this.cfunction(s);
            break;
        case ClassDef:
            this.cclass(s);
            break;
        case Return_:
            if (this.u.ste.blockType !== FunctionBlock)
                throw new SyntaxError("'return' outside function");
            if (s.value)
				out('eval(' + this.getCurrentLevel() + '.call + " = ', this.vexpr(s.value),';");\n');
            else
				out('eval(' + this.getCurrentLevel() + '.call + " = null;");');
	        out("$scope[" + Sk.problem + "] = " + this.getCurrentLevel() + ".parent;\n"); 
			out("$scopename[" + Sk.problem + "] = " + this.getCurrentLevel() + ".parentName;\n"); 
			out("$scopestack[" + Sk.problem + "] = " + this.getCurrentLevel() + ".parentStack;\n");
			out('eval("', this.getStack(), '.pop();");\n');
			out("break;\n")
            break;
        case Delete_:
            this.vseqexpr(s.targets);
            break;
        case Assign:
            var n = s.targets.length;
            var val = this.vexpr(s.value);
            for (var i = 0; i < n; ++i)
                this.vexpr(s.targets[i], val);
			this.u.blocks[this.u.curblock].expr = 0;
            break;
        case AugAssign:
            return this.caugassign(s);
        case Print:
            this.cprint(s);
            break;
        case For_:
            return this.cfor(s);
        case While_:
            return this.cwhile(s);
        case If_:
            return this.cif(s);
        case Raise:
            return this.craise(s);
        case TryExcept:
            return this.ctryexcept(s);
        case TryFinally:
            return this.ctryfinally(s);
        case Assert:
            return this.cassert(s);
        case Import_:
            return this.cimport(s);
        case ImportFrom:
            return this.cfromimport(s);
        case Global:
            break;
        case Expr:
            this.vexpr(s.value);
            break;
        case Pass:
            break;
        case Break_:
            if (this.u.breakBlocks.length === 0)
                throw new SyntaxError("'break' outside loop");
            this._jump(this.u.breakBlocks[this.u.breakBlocks.length - 1]);
            break;
        case Continue_:
            this.ccontinue(s);
            break;
        default:
            goog.asserts.fail("unhandled case in vstmt");
    }
};

Compiler.prototype.vseqstmt = function(stmts, isFunc)
{
	var block;
    for (var i = 0; i < stmts.length; ++i) 
    {
    	if (i || isFunc && !i)
		{
			block = this.newBlock();
			this._jump(block)
			this.setBlock(block);		
    	}
		this.vstmt(stmts[i]);
		if (stmts[i].constructor != If_)
			this.u.blocks[this.u.curblock].lineno = stmts[i].lineno - 1;
    }
};
var OP_FAST = 0;
var OP_GLOBAL = 1;
var OP_DEREF = 2;
var OP_NAME = 3;
var D_NAMES = 0;
var D_FREEVARS = 1;
var D_CELLVARS = 2;

Compiler.prototype.isCell = function(name)
{
    var mangled = mangleName(this.u.private_, name).v;
    var scope = this.u.ste.getScope(mangled);
    var dict = null;
    if (scope === CELL)
        return true;
    return false;
};

/**
 * @param {Sk.builtin.str} name
 * @param {Object} ctx
 * @param {string=} dataToStore
 */
Compiler.prototype.nameop = function(name, ctx, dataToStore, funcArg, isFunc)
{
    if ((ctx === Store || ctx === AugStore || ctx === Del) && name.v === "__debug__")
        this.error("can not assign to __debug__");
    if ((ctx === Store || ctx === AugStore || ctx === Del) && name.v === "None")
        this.error("can not assign to None");

    if (name.v === "None") return "null";
    if (name.v === "True") return "true";
    if (name.v === "False") return "false";

    var mangled = mangleName(this.u.private_, name).v;
    var op = 0;
    var optype = OP_NAME;
    var scope = this.u.ste.getScope(mangled);
    var dict = null;
    switch (scope)
    {
        case FREE:
            dict = "$free";
            optype = OP_NAME;
            break;
        case CELL:
            dict = this.getCurrentLevel() + ".cell";
            optype = OP_NAME;
            break;
        case LOCAL: //decommented
            // can't do FAST in generators or at module/class scope
            if (this.u.ste.blockType === FunctionBlock && !this.u.ste.generator && !isFunc)
                optype = OP_FAST;
            break;
        /*case GLOBAL_IMPLICIT:
            if (this.u.ste.blockType === FunctionBlock)
                optype = OP_GLOBAL;
            break;*/
        case GLOBAL_EXPLICIT:
            optype = OP_GLOBAL;
        default:
            break;
    }

    // have to do this after looking it up in the scope
    mangled = fixReservedWords(mangled);

    //print("mangled", mangled);
    // TODO TODO TODO todo; import * at global scope failing here
    goog.asserts.assert(scope || name.v.charAt(1) === '_');

    // in generator or at module scope, we need to store to $loc, rather that
    // to actual JS stack variables.
    var mangledNoPre = mangled;
    if (this.u.ste.generator || this.u.ste.blockType !== FunctionBlock)
        mangled =this.getCurrentLevel() + '.loc.' + mangled; //?
    else if (optype === OP_FAST || optype === OP_NAME)
    {
    	if ( ctx != Param )
			mangled = this.getCurrentLevel() + (funcArg ? '.param.' : '.loc.') + mangled;
    }

    switch (optype)
    {
        case OP_FAST:
            switch (ctx)
            {
                case Load:
                case Param:
                    return mangled;
                case Store:
                    out(mangled, "=", dataToStore, ";");
                    break;
                case Del:
                    out("delete ", mangled, ";");
                    break;
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        case OP_NAME:
            switch (ctx)
            {
                case Load:
                    var v = this.gensym('loadname');
                    // can't be || for loc.x = 0 or null
                    out("var t_scope = $scope[" + Sk.problem + "], t_scopename = $scopename[" + Sk.problem + "], t_scopestack = $scopestack[" + Sk.problem + "];\n");
					out("while (", 
						'eval("$loc[' + Sk.problem + ']." + t_scopename + ".stack[" + t_scopestack + "].loc." + "' + mangledNoPre + '")',
						" == undefined && \n",
						'eval("$loc[' + Sk.problem + ']." + t_scopename + ".stack[" + t_scopestack + "].parentStack != undefined"))\n',
						'{t_scope = eval("$loc[' + Sk.problem + ']." + t_scopename + ".stack[" + t_scopestack + "].parent");\n',
						'var nm = t_scopename;',
						't_scopename = eval("$loc[' + Sk.problem + ']." + t_scopename + ".stack[" + t_scopestack + "].parentName");\n',
						't_scopestack = eval("$loc[' + Sk.problem + ']." + nm + ".stack[" + t_scopestack + "].parentStack");}')
                    out(v, "=", 
                    	'eval("$loc[' + Sk.problem + ']." + t_scopename + ".stack[" + t_scopestack + "].loc." + "' + mangledNoPre + '")', 
                    	"!==undefined?",
                    	'eval("$loc[' + Sk.problem + ']." + t_scopename + ".stack[" + t_scopestack + "].loc." + "' + mangledNoPre + '")',
                    	":Sk.misceval.loadname('",mangledNoPre,"',$gbl[" + Sk.problem + "]);");
                    return isFunc ? [v, '"$loc[' + Sk.problem + ']." + t_scopename + ".stack[" + t_scopestack + "].loc.' + mangledNoPre + '"'] : v;
                case Store:
                    out(mangled, "=", dataToStore, ";");
                    break;
                case Del:
                    out("delete ", mangled, ";");
                    break;
                case Param:
                    return mangled;
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        case OP_GLOBAL:
            switch (ctx)
            {
                case Load:
                    return this._gr("loadgbl", "Sk.misceval.loadname('", mangledNoPre, "',$gbl[" + Sk.problem + "])");
                case Store:
                    out("$gbl[" + Sk.problem + "].", mangledNoPre, "=", dataToStore, ';');
                    break;
                case Del:
                    out("delete $gbl[" + Sk.problem + "].", mangledNoPre);
                    break;
                default:
                    goog.asserts.fail("unhandled case in name op_global");
            }
            break;
        case OP_DEREF:
            switch (ctx)
            {
                case Load:
                    return dict + "." + mangledNoPre;
                case Store:
                    out(dict, ".", mangledNoPre, "=", dataToStore, ";");
                    break;
                case Param:
                    return mangledNoPre;
                default:
                    goog.asserts.fail("unhandled case in name op_deref");
            }
            break;
        default:
            goog.asserts.fail("unhandled case");
    }
};

Compiler.prototype.enterScope = function(name, key, lineno)
{
    var u = new CompilerUnit();
    u.ste = this.st.getStsForAst(key);
    u.name = name;
    u.firstlineno = lineno;

    this.stack.push(this.u);
    this.allUnits.push(u);
    var scopeName = 'scope' + this.gensymcount++;
    u.scopename = scopeName;

    this.u = u;
    this.u.activateScope();

    this.nestlevel++;

    return scopeName;
};

Compiler.prototype.exitScope = function()
{
    var prev = this.u;
    this.nestlevel--;
    if (this.stack.length - 1 >= 0)
        this.u = this.stack.pop();
    else
        this.u = null;
    if (this.u)
        this.u.activateScope();

    if (prev.name.v !== "<module>") // todo; hacky
        out(prev.scopename, ".co_name=new Sk.builtins['str'](", prev.name['$r']().v, ");");
};

Compiler.prototype.cbody = function(stmts)
{
	var block;
    for (var i = 0; i < stmts.length; ++i) 
    {
    	if (i)
		{
			block = this.newBlock();
			this._jump(block)
			this.setBlock(block);		
    	}
		this.vstmt(stmts[i]);
		if (stmts[i].constructor != If_)
			this.u.blocks[this.u.curblock].lineno = stmts[i].lineno - 1;
    }
};

Compiler.prototype.cprint = function(s)
{
    goog.asserts.assert(s instanceof Print);
    var dest = 'null';
    if (s.dest)
        dest = this.vexpr(s.dest);

    var n = s.values.length;
    // todo; dest disabled
    for (var i = 0; i < n; ++i)
        out('Sk.misceval.print_(', /*dest, ',',*/ "new Sk.builtins['str'](", this.vexpr(s.values[i]), ').v);');
	this.u.blocks[this.u.curblock].expr = 0;
    if (s.nl)
        out('Sk.misceval.print_(', /*dest, ',*/ '"\\n");');
};

Compiler.prototype.cmod = function(mod)
{
    //print("-----");
    //print(Sk.astDump(mod));
    var modf = this.enterScope(new Sk.builtin.str("<module>"), mod, 0);
    var entryBlock = this.newBlock('module entry');
	var lvl = this.getCurrentLevel(modf);
    this.u.prefixCode = "";
    this.u.varDeclsCode =  lvl + ".blk = 0; $scope[" + Sk.problem + "] = 0; $scopestack[" + Sk.problem + "] = 0; $scopename[" + Sk.problem + "] = '" + modf + "';";
    this.u.switchCode = "switch(" + this.getCurrentLevel(modf) + ".blk){"; //
    this.u.suffixCode = "}"//"}});";

    switch (mod.constructor)
    {
        case Module:
            this.cbody(mod.body);
            out(this.getCurrentLevel(modf) + ".blk = -1; break;");
            break;
        default:
            goog.asserts.fail("todo; unhandled case in compilerMod");
    }
    this.exitScope();
	for (var i = 0; i < mod.body.length && mod.body[i]._astname == "FunctionDef"; ++i );
	this.allUnits[0].firstlineno = i < mod.body.length ? this.allUnits[0].blocks[i].lineno : -1;
    this.result.push(this.outputAllUnits());
    return modf;
};

/**
 * @param {string} source the code
 * @param {string} filename where it came from
 * @param {string} mode one of 'exec', 'eval', or 'single'
 */
Sk.compile = function(source, filename, mode)
{
    //print("FILE:", filename);
    var cst = Sk.parse(filename, source);
    var ast = Sk.astFromParse(cst, filename);
    var st = Sk.symboltable(ast, filename);
    var c = new Compiler(filename, st, 0, source); // todo; CO_xxx
    var funcname = c.cmod(ast);
    var ret = c.result.join('');
    return {
        funcname: funcname,
        code: ret,
        scopes: c.allUnits,
        ast: ast
    };
};

goog.exportSymbol("Sk.compile", Sk.compile);
