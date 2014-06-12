'use strict'

define('ModesConversion', ['jQuery', 'jQueryUI', 'ExecutionUnitCommands'], function(){
    var ExecutionUnitCommands = require('ExecutionUnitCommands');
    var Exceptions = require('Exceptions');
    var IncorrectInput = Exceptions.IncorrectInput;
    var InternalError = Exceptions.InternalError;

    var BIN_OPS = {
        'Add': 'ADD',
        'Sub': 'MINUS',
        'Mult': 'MULTIPLY',
        'Div': 'DIVIDE',
        'Pow': 'POWER'
    }

    var COMPARE_OPS = {
        'Eq': 'EQ',
        'NotEq': 'NEQ',
        'Lt': 'LT',
        'LtE': 'LTE',
        'Gt': 'GT',
        'GtE': 'GTE'
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

        convertAssign_: function(command, connection) {
            var block = this.initBlock_('variables_set', connection);
            block.setFieldValue(command.targets[0].id.v, 'VAR');
            this.convert(command.value, block.getInput('VALUE').connection);
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
                var value = getArgumentValue_(arg)
                field.setValue(value.toString());
            }
            return block;
        },

        convertCompare_: function(command, connection) {
            var op = command.ops[0]
            if (op.name in COMPARE_OPS) {
                var block = this.initBlock_("logic_compare", connection);
                block.getField_('OP').setValue(COMPARE_OPS[op.name]);
                var blockA = this.convert(command.left, block.getInput('A').connection);
                var blockB = this.convert(command.comparators[0], block.getInput('B').connection);
                return block;
            }
            throw new IncorrectInput('Оператор ' + op.name + ' не разрешен в этой задаче.');
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

    function getArgumentValue_(command) {
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
    }
});

