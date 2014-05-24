'use strict'

define('ModesConversion', ['jQuery', 'jQueryUI', 'CommandsMode', 'ExecutionUnitCommands'], function(){
    var CommandsMode = require('CommandsMode');
    var ExecutionUnitCommands = require('ExecutionUnitCommands');
    var Exceptions = require('Exceptions');
    var IncorrectInput = Exceptions.IncorrectInput;
    var InternalError = Exceptions.InternalError;

    function blocksToCommands(problem) {
        var Blockly = problem.Blockly;

        // Get blocks for function definitions.
        var blocks = Blockly.mainWorkspace.getTopBlocks();
        blocks = blocks.filter(function(block) {
            return block.type == "funcdef";
        })
        blocks.push(problem.mainBlock);

        var newCmdList = new CommandsMode.Block([], undefined, problem);
        for (var i=0, block; block=blocks[i]; ++i) {
            var cmd = block.toCommand();
            newCmdList.pushCommand(cmd);
        }
        return newCmdList;
    }
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var BIN_OPS = {
        'Add': 'ADD',
        'Sub': 'MINUS',
        'Mult': 'MULTIPLY',
        'Div': 'DIVIDE',
        'Pow': 'POWER'
    }

    /**
    * Convertor from python to blockly.
    */
    var Convertor = $.inherit({
        __constructor: function(problem) {
            this.problem = problem;
            this.Blockly = problem.Blockly;
            this.euCommands = problem.executionUnit.getCommands();
            this.definitions_ = {};

            // set information about condition functions
            this.euConditions = {};
            var euCondProp = this.problem.executionUnit.getConditionProperties();
            for (var i = 0, condition; condition = euCondProp[i]; ++i) {
                this.euConditions[condition.name] = condition;
            }
        },

        convert: function(command, connection) {
            /**
            * Convert python command to Blockly.Block and connect it to provided
            * connection. Return block.
            */
            var handlerName = 'convert' + command._astname + '_';
            var handler = this[handlerName];
            if (!handler)
                console.error(handlerName + ' is not defined')
            var block = handler.call(this, command, connection);
            return block;
        },

        convertList: function(commands, connection) {
            /**
            * Convert list of commands. Blocks are connected to connection.
            * No return.
            */
            for (var i = 0, command; command = commands[i]; ++i) {
                var block = this.convert(command, connection);
                if (block && block.nextConnection)
                    connection = block.nextConnection;
            }
        },

        convertExpr_: function(command, connection) {
            return this.convert(command.value, connection);
        },

        convertNum_: function(command, connection) {
            var block = this.initBlock_('math_number', connection)
            block.setFieldValue(command.n.toString(), 'NUM');
            return block
        },

        convertName_: function(command, connection) {
            if (command.id.v == 'True' || command.id.v == 'False')
                return this.convertBool_(command, connection);
            if (command.id.v == 'None')
                return this.convertNone_(command, connection);
            var block = this.initBlock_('variables_get', connection)
            block.setFieldValue(command.id.v, 'VAR');
            return block
        },

        convertBool_: function(command, connection) {
            var block = this.initBlock_('logic_boolean', connection)
            block.setFieldValue(command.id.v.toUpperCase(), 'BOOL');
            return block
        },

        convertNone_: function(command, connection) {
        },

        convertCall_: function(command, connection) {
            var name = command.func.id.v;
            if (name in this.euConditions)
                return this.convertConditions_(command, connection);

            // create block
            if (name in this.euCommands) {
                // predefined command
                var block = this.initBlock_(name, connection);
            } else {
                // funccall
                var block = this.initBlock_('funccall', connection);
                var name = command.func.id.v
                var funcdef = this.definitions_[name];
                block.setFieldValue(name, 'NAME');

                var xmlMutation = document.createElement('mutation');
                xmlMutation.setAttribute('name', name)
                for (var i = 0, arg; arg = funcdef.args.args[i]; ++i) {
                    var xmlArg = document.createElement('arg');
                    xmlArg.setAttribute('name', arg.id.v);
                    xmlMutation.appendChild(xmlArg);
                }
                block.domToMutation(xmlMutation);
            }

            // convert args
            for (var i = 0, arg; arg = command.args[i]; ++i) {
                var input = block.getInput('ARG' + i);
                var blockArg = this.convert(arg, input.connection);
            }
            return block
        },

        convertConditions_: function(command, connection) {
            var block = this.initBlock_('conditions', connection);
            var type = command.func.id.v;
            block.rebuildArgumentFields_(block.inputCondition_, type, 1);
            for (var i = 1, arg; arg = command.args[i - 1]; ++i) {
                var field = block.getField_('ARG' + i);
                var value = getArgumentValue(arg)
                field.setValue(value.toString());
            }
            return block;
        },

        convertFor_: function(command, connection) {
            var block = this.initBlock_('for', connection);
            var cmdTimes = command.iter.args[0];
            if (cmdTimes._astname == 'Call') {
                cmdTimes = cmdTimes.args[0];
            }
            this.convert(cmdTimes, block.getInput('TIMES').connection);
            this.convertList(command.body, block.getInput('DO').connection);
            return block;
        },

        convertIf_: function(command, connection) {
            var block = this.initBlock_('if', connection);

            var flatCmd = [];
            var elseifNum = -1;
            var elseNum = 0;
            for (var curCmd = command;;) {
                if (curCmd._astname == 'If') {
                    elseifNum++;
                } else {
                    elseNum++;
                }

                flatCmd.push(curCmd);
                if (!curCmd.orelse || !curCmd.orelse.length)
                    break
                if (curCmd.orelse.length == 1) {
                    curCmd = curCmd.orelse[0];
                } else {
                    curCmd = curCmd.orelse;
                }
            }

            // mutation
            var xmlMutation = document.createElement('mutation');
            xmlMutation.setAttribute('elseif', elseifNum);
            xmlMutation.setAttribute('else', elseNum);
            block.domToMutation(xmlMutation);

            //
            for (var i = 0, cmd; cmd = flatCmd[i]; ++i) {
                if (cmd._astname == 'If') {
                    var inputIf = block.getInput('IF' + i);
                    var inputDo = block.getInput('DO' + i);
                    var blockIf = this.convert(cmd.test, inputIf.connection);
                    this.convertList(cmd.body, inputDo.connection);
                } else {
                    var inputDo = block.getInput('ELSE');
                    if (cmd.length) {
                        this.convertList(cmd, inputDo.connection);
                    } else {
                        this.convert(cmd, inputDo.connection);
                    }
                }
            }
            return block;
        },

        convertWhile_: function(command, connection) {
            var block = this.initBlock_('while', connection);

            var argInput = block.getInput('BOOL');
            var argBlock = this.convert(command.test, argInput.connection);

            this.convertList(command.body, block.getInput('DO').connection);

            return block;
        },

        convertFunctionDef_: function(command, connection) {
            var block = this.initBlock_('funcdef', connection);
            var name = command.name.v
            this.definitions_[name] = command;
            block.setFieldValue(name, 'NAME');

            var xmlMutation = document.createElement('mutation');
            for (var i = 0, arg; arg = command.args.args[i]; ++i) {
                var xmlArg = document.createElement('arg');
                xmlArg.setAttribute('name', arg.id.v);
                xmlMutation.appendChild(xmlArg);
            }
            block.domToMutation(xmlMutation);

            this.convertList(command.body, block.getInput('STACK').connection);
            return block
        },

        convertPass_: function(command, connection) {

        },

        convertUnaryOp_: function(command, connection) {
            if (command.op.name == "Not") {
                var block = this.initBlock_("logic_negate", connection);
                var childBlock = this.convert(command.operand, block.getInput('BOOL').connection);
                return block;
            }
            throw new IncorrectInput('Оператор ' + command.op.name + ' не разрешен в этой задаче.');
        },

        convertBinOp_: function(command, connection) {
            if (command.op.name in BIN_OPS) {
                var block = this.initBlock_("math_arithmetic", connection);
                block.getField_('OP').setValue(BIN_OPS[command.op.name]);
                var blockA = this.convert(command.left, block.getInput('A').connection);
                var blockB = this.convert(command.right, block.getInput('B').connection);
                return block;
            }
            throw new IncorrectInput('Оператор ' + command.op.name + ' не разрешен в этой задаче.');
        },

        convertBoolOp_: function(command, connection) {
            var block = this.initBlock_("logic_operation", connection)
            block.getField_('OP').setValue(command.op.name.toUpperCase());
            var blockA = this.convert(command.values[0], block.getInput('A').connection);
            var blockB = this.convert(command.values[1], block.getInput('B').connection);
            return block
        },

        initBlock_: function(type, connection) {
            /**
            * Create, render block and connect it to provided connection.
            */
            var block = this.Blockly.Block.obtain(this.Blockly.mainWorkspace, type);
            block.initSvg();
            block.render();

            if (connection) {
            	if (connection.type == this.Blockly.NEXT_STATEMENT &&
                    block.previousConnection) {
                	connection.connect(block.previousConnection);
            	} else if (connection.type == this.Blockly.INPUT_VALUE &&
                    block.outputConnection) {
                	connection.connect(block.outputConnection);
                }
            }
            return block;
        }
    });

    function pythonTreeToBlocks(problem, commands) {
        /**
        * Create and render blocks in main workspace.
        * @param commands - list of top level python commands.
        */
        var Blockly = problem.Blockly;
        var convertor = new Convertor(problem);
        convertor.convertList(commands);
    }
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function pythonTreeToBlocks_(commands, parent, problem) {
        var block = new CommandsMode.Block([], parent, problem);
        var execCommands = problem.executionUnit.getCommands();
        for (var i = 0; i < commands.length; ++i)
        {
            switch(commands[i]._astname) {
                case 'Expr':
                    if (commands[i].value._astname != 'Call' ||
                        commands[i].value.func._astname != 'Name')
                        return undefined;

                    var j = 0;

                    var execCommand = execCommands[commands[i].value.func.id.v];
                    if (execCommand) {
                        if (execCommand.name != commands[i].value.func.id.v) {
                            throw new IncorrectInput('Некорректная команда');
                        }
                        if (!(commands[i].value.args.length == execCommand.getArguments().length)) {
                            throw new IncorrectInput('Неверное число аргументов');
                        }

                        block.pushCommand(new CommandsMode.Command(commands[i].value.func.id.v,
                            execCommand.getArguments(),
                            getArgumentValues(commands[i]),
                            block, undefined, problem));
                    }
                    else {
                        block.pushCommand(new CommandsMode.FuncCall(commands[i].value.func.id.v, getArgumentValues(commands[i]), block, undefined, problem));
                    }
                    break;
                case 'For':
                    //__constructor : function(body, cnt, parent, id)
                    if (!commands[i].iter || commands[i].iter._astname != 'Call' ||
                        commands[i].iter.func._astname != 'Name' || commands[i].iter.func.id.v != 'range' ||
                        commands[i].iter.args.length != 1 || (commands[i].iter.args[0]._astname != 'Num' && commands[i].iter.args[0]._astname != 'Name')) //
                        return undefined;
                    var cnt = undefined;

                    switch (commands[i].iter.args[0]._astname) {
                        case 'Num':
                            cnt = commands[i].iter.args[0].n;
                            break;
                        case 'Name':
                            cnt = commands[i].iter.args[0].id.v;
                            break;
                    }

                    var forStmt = new CommandsMode.ForStmt(undefined, cnt, block, undefined, problem);
                    var body = pythonTreeToBlocks(commands[i].body, forStmt, problem);
                    if (!body)
                        return undefined;
                    forStmt.setBody(body);
                    block.pushCommand(forStmt);
                    break;
                case 'If':
                    //__constructor : function(testName, args, firstBlock, secondBlock, parent, id, problem)
                    var dict = convertCondition(commands[i].test);
                    if (!dict)
                        return undefined;
                    var conditionProperties = problem.executionUnit.getConditionProperties(dict['testName']);
                    if (!conditionProperties) {
                        throw new IncorrectInput('Некорректное имя функции сравнения');
                    }
                    var ifStmt = new CommandsMode.IfStmt(dict['testName'], [dict['testName']].concat(dict['args']), undefined, undefined, block, undefined, problem);
                    var body1 = pythonTreeToBlocks(commands[i].body, ifStmt, problem);
                    var body2;
                    if (commands[i].orelse.length)
                        body2 = pythonTreeToBlocks(commands[i].orelse, ifStmt, problem);
                    ifStmt.setBlocks(body1, body2);
                    block.pushCommand(ifStmt);
                    break;
                case 'While':
                    //__constructor : function(testName, args, body, parent, id, problem)
                    var dict = convertCondition(commands[i].test);
                    if (!dict)
                        return undefined;
                    var conditionProperties = problem.executionUnit.getConditionProperties(dict['testName']);
                    if (!conditionProperties) {
                        throw new IncorrectInput('Некорректное имя функции сравнения');
                    }
                    var whileStmt = new CommandsMode.WhileStmt(dict['testName'], [dict['testName']].concat(dict['args']), undefined, block, undefined, problem)
                    var body = pythonTreeToBlocks(commands[i].body, whileStmt, problem);
                    if (!body)
                        return undefined;
                    whileStmt.setBlocks(body);
                    block.pushCommand(whileStmt);
                    break;
                case 'FunctionDef':
                    var args = [];
                    for (var j = 0; j < commands[i].args.args.length; ++j) {
                        args.push(commands[i].args.args[j].id.v);
                    }
                    if (problem.functions[commands[i].name.v] == undefined) {
                        problem.functions[commands[i].name.v] = [];
                    }

                    if (problem.functions[commands[i].name.v][args.length] != undefined) {
                        throw new IncorrectInput('Несколько функций с одним и тем же именем не поддерживаются в визуальном режиме');
                    }

                    var funcDef = new CommandsMode.FuncDef(commands[i].name.v, args, undefined, block, undefined, problem);
                    problem.functions[commands[i].name.v][args.length] = funcDef;
                    var body = pythonTreeToBlocks(commands[i].body, funcDef, problem);
                    funcDef.setCommands(body.commands);
                    funcDef.body = body;
                    block.pushCommand(funcDef);

                    break;
                case 'Pass':
                    break;
                default:
                    return undefined;
            }
        }
        return block;
    }

    function convertCondition(expr){
        switch (expr._astname) {
            case 'Call':
                if (expr.func._astname != 'Name' || !expr.args) //
                    return undefined;
                var testName = '';
                var args = [];
                //switch(expr.func.id.v)
                //{
                    //case 'objectPosition':
                testName = expr.func.id.v;
                args.push(0);
                for (var j = 0; j < expr.args.length; ++j) {
                    switch (expr.args[j]._astname) {
                        case 'Str':
                            args.push(expr.args[j].s.v);
                            break;
                        case 'Num':
                            args.push(expr.args[j].n);
                            break;
                        case 'Name':
                            args.push(expr.args[j].id.v);
                            break;
                        default:
                            args.push(undefined);
                    }
                }

                /*if (expr.args.length != builtinFunctions[0]['args'].length) //reanme to testFunction!
                    return undefined;*/
                /*for (var j = 0; j < expr.args.length; ++j) {
                    /*if (expr.args[j]._astname != builtinFunctions[0]['args'][j]['type'])
                        return undefined;
                    for (var k = 0; k <  builtinFunctions[0]['args'].length; ++k){
                        for (var l = 0; l < builtinFunctions[0]['args'][k]['dict'].length; ++l){
                            if (builtinFunctions[0]['args'][k]['dict'][l][0] == expr.args[j].s.v){
                                args.push(l);
                                break;
                            }
                        }
                    }
                }
                        //break;
                //  default:
                //      return undefined;
                //}*/
                return {'testName': testName, 'args': args}
            case 'UnaryOp':
                if (expr.op.prototype._astname != 'Not')
                    return undefined;
                var dict = convertCondition(expr.operand);
                if (!dict)
                    return undefined;
                dict['args'][0] = dict['args'][0] == 'not' ? '' : 'not';
                return dict;
        }
        return undefined;
    }

    function getArgumentValue(command) {
        switch(command._astname) {
            case 'Num':
                return command.n;
            case 'Name':
                return command.id.v;
            case 'Str':
                return command.s.v;
            default:
                throw new IncorrectInput('Неподдерживаемый тип аргумента');
        }
    }

    return {
        pythonTreeToBlocks: pythonTreeToBlocks,
        blocksToCommands: blocksToCommands,
    }
});

