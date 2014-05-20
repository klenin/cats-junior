/**
 * Blocks set-up
 */
'use strict';


define('Blocks', ['Problems', 'CommandsMode'], function() {
    var CommandsMode = require('CommandsMode');

    function generate(problem, requiredBlocks) {
        /**
        *  Generate blocks for problem.
        */
        var Blockly = problem.Blockly;

        var SimpleBlock = $.inherit({
            __constructor: function(problem) {
                this.problem = problem;
            },

            rebuildArgumentFields_: function(input, args, nSkip) {
                /**
                * Clean 'argX' fields for block and build them again.
                * @param input - Blockly.Input, fields container.
                * @param args - list of ExecutionUnitCommands.CommandArgument.
                * @param nSkip - number of fields to skip (e.g. ConditionalBlock
                *   has 2 constant Fields).
                */
                if (!nSkip) nSkip = 0;

                // Remove fields.
                for (var i = nSkip, field; field = this.getField_('arg' + i); ++i) {
                    input.removeField('arg' + i);
                }

                for (var i = 0, arg; arg = args[i]; ++i) {
                    if (arg.options) {
                        // CommandArgumentSelect
                        var opts = arg.options.map(function(opt) {
                            return opt.slice().reverse().map(function(a) {
                                return a.toString();
                            });
                        })
                        var field = new Blockly.FieldDropdown(opts);
                    } else {
                        // CommandArgumentSpin
                        var field = new Blockly.FieldTextInput('0', Blockly.FieldTextInput.numberValidator);
                    }
                    var value = arg.getValue()
                    if (value)
                        field.setValue(value.toString());
                    input.appendField(field, 'arg' + (nSkip + i));
                }
            },

            getArgNames: function() {
                var l = [];
                for (var i = 0, field; field = this.getField_('arg' + i); i++) {
                    l.push('arg' + i);
                }
                return l;
            },

            getArgValues: function() {
                var l = [];
                for (var i = 0, field; field = this.getField_('arg' + i); i++) {
                    l.push(field.getValue());
                }
                return l;
            },

            getArgField: function(index) {
                /**
                * Return block's field which corresponds to argument's index number.
                */
                for (var i = 0, n = 0, input; input = this.inputList[i]; ++i)
                    for (var j = 0, field; field = input.fieldRow[j]; ++j)
                        if (field.EDITABLE)
                            if (index == n++)
                                return field;
                console.warn("Argument with such index doesn't exist.")
            },

            getDirectChildren_: function(input) {
                // input - Blockly.Input or string
                if (!input.sourceBlock_)
                    input = this.getInput(input)

                // returns direct children
                var children = []
                var block = input.connection.targetBlock();
                if (block) {
                    children.push(block)
                    while (block = block.nextConnection.targetBlock()) {
                        children.push(block)
                    }
                }
                return children
            },

            inputToCMBlock_: function(input, parent) {
                // input - Blockly.Input or string
                if (!input.sourceBlock_)
                    input = this.getInput(input)

                var cmBlock = new CommandsMode.Block([], parent, problem);

                var children = this.getDirectChildren_(input);
                for (var i = 0, child; child = children[i]; ++i) {
                    var cmd = child.toCommand(cmBlock);
                    cmBlock.pushCommand(cmd);
                }
                return cmBlock;
            }

            // DEBUG: Pretty print xml representation of workspace.
            , onchange: function () {
                if (!this.workspace) {
                    return;
                }

                // create node if doesn't exist
                var $table = $('#cons' + problem.tabIndex).parent().closest('table');
                var $output = $table.find('.pprint')
                if (!$output.length) {
                    $output = $('<tr><td><pre class="pprint cons"></pre></td></tr>').appendTo($table).find('.pprint');
                }

                // workspaceToDom pprint
                var dom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
                var text = Blockly.Xml.domToPrettyText(dom);
                $output.text(text);
            }
        });

        var ConditionalBlock = $.inherit(SimpleBlock, {
            appendArgs: function() {
                /**
                * Create fields for conditional block ('if', 'while', etc).
                */

                // Define types of conditions.
                var conditionProperties = this.problem.executionUnit.getConditionProperties()
                var condTypes = []
                for (var i = 0, func; func = conditionProperties[i]; ++i) {
                    condTypes.push([func.title, func.name])
                }

                this.inputCondition_ = this.appendDummyInput('cond');
                // Define fields:
                // - types selector
                var fType = new Blockly.FieldDropdown(condTypes, this.rebuildFields_);
                this.inputCondition_.appendField(fType, 'arg0');
                // - logical negation
                var fNegation = new Blockly.FieldDropdown([['', ''], ['не', 'not']]);
                this.inputCondition_.appendField(fNegation, 'arg1');
                // - fields for each type
                this.conditionProperties_ = {}
                for (var i = 0, func; func = conditionProperties[i]; ++i) {
                    this.conditionProperties_[func.name] = func;
                }
                this.rebuildArgumentFields_(this.inputCondition_, conditionProperties[0].args, 2);
                this.currentCondType_ = this.getFieldValue('arg0');
            },

            mutationToDom: function() {
                // console.log('mutationToDom')
                var condType = this.getFieldValue('arg0');
                if (condType != this.currentCondType_) {
                    this.currentCondType_ = condType;
                    var args = this.conditionProperties_[condType].args;
                    this.rebuildArgumentFields_(this.inputCondition_, args, 2);
                }

                // var container = document.createElement('mutation');
                // NOTE: DONT REMOVE FOR NOW
                // for (var i = 2, fValue; fValue = this.getFieldValue('arg' + i); ++i) {
                //     var xmlField = document.createElement('field');
                //     xmlField.setAttribute('name', 'arg' + i);
                //     xmlField.setAttribute('value', fValue);
                //     container.appendChild(xmlField);
                // }
                // return container;
            },
        });

        var FuncCallBlock = $.inherit(SimpleBlock, {
        });

        var CommandBlock = $.inherit(FuncCallBlock, {
            init: function(name) {
                this.setColour(0);
                this.appendArgs(name);
                this.setPreviousStatement(true);
                this.setNextStatement(true);
            },

            appendArgs: function(name) {
                this.name_ = name;
                this.text_ = this.problem.executionUnit.executionUnit.__self.cmdClassToName[name]

                this.input_ = this.appendDummyInput()
                    .appendField(this.text_)

                var args = this.problem.executionUnit.getCommands()[name].getArguments()
                if (!args) console.log('Wrong command name is provided to block.');
                this.rebuildArgumentFields_(this.input_, args);
            },

            toCommand: function(parent) {
                var type = this.type;
                var command = problem.executionUnit.getCommands()[type];
                var args = this.getArgValues();
                var argsDefinition = command.getArguments();
                if (command.hasCounter) {
                    var cmd = new CommandsMode.CommandWithCounter(type, argsDefinition, args, parent, this, problem);
                }
                else {
                    var cmd = new CommandsMode.Command(type, argsDefinition, args, parent, this, problem);
                }
                return cmd;
            }
        });

        var Blocks = {}

        // Standard blocks
        Blocks['if'] = $.inherit(ConditionalBlock, {
            /**
            * Condition "if".
            */
            init: function() {
                this.setColour(210);
                this.appendDummyInput('IF')
                    .appendField('Если');
                this.appendArgs();
                this.appendStatementInput('DO')
                    .appendField('то');
                this.setPreviousStatement(true);
                this.setNextStatement(true);
            },

            toCommand: function(parent) {
                var args = this.getArgValues();
                var cmd = new CommandsMode.IfStmt(args[0], args, undefined, undefined, parent, this, problem);
                var cmBlock = this.inputToCMBlock_('DO', cmd);
                cmd.setBlocks(cmBlock, undefined);
                return cmd;
            }
        });

        Blocks['ifelse'] = $.inherit(ConditionalBlock, {
            /**
            * Condition "if/else".
            */
            init: function() {
                this.setColour(210);
                this.appendDummyInput('IF')
                    .appendField('Если');
                this.appendArgs();
                this.appendStatementInput('DO')
                    .appendField('то');
                this.appendStatementInput('ELSE')
                    .appendField('иначе');
                this.setPreviousStatement(true);
                this.setNextStatement(true);
            },

            toCommand: function(parent) {
                var args = this.getArgValues();
                var cmd = new CommandsMode.IfStmt(args[0], args, undefined, undefined, parent, this, problem);
                var cmBlock1 = this.inputToCMBlock_('DO', cmd);
                var cmBlock2 = this.inputToCMBlock_('ELSE', cmd);
                cmd.setBlocks(cmBlock1, cmBlock2);
                return cmd;
            }
        });

        Blocks['while'] = $.inherit(ConditionalBlock, {
            /**
            * Loop "while".
            */
            init: function() {
                this.setColour(210);
                this.appendDummyInput('WHILE')
                    .appendField('Пока');
                this.appendArgs();
                this.appendStatementInput('DO')
                this.setPreviousStatement(true);
                this.setNextStatement(true);
            },

            toCommand: function(parent) {
                var args = this.getArgValues();
                var cmd = new CommandsMode.WhileStmt(args[0], args, null, parent, this, problem);
                var cmBlock = this.inputToCMBlock_('DO', cmd);
                cmd.setBlocks(cmBlock, undefined);
                return cmd;
            }
        });

        Blocks['for'] = $.inherit(SimpleBlock, {
            /**
            * N times repeat.
            */
            init: function() {
                this.setColour(120);
                this.input_ = this.appendDummyInput()
                    .appendField('Повторить')
                    .appendField(new Blockly.FieldTextInput('10',
                        Blockly.FieldTextInput.nonnegativeIntegerValidator), 'arg0')
                    .appendField('раз', 'TIMES');
                this.appendStatementInput('DO')
                this.setPreviousStatement(true);
                this.setNextStatement(true);
            },

            rebuildArgumentFields_: function(input, args, nSkip) {
                this.__base(input, args, nSkip);
                this.input_.removeField('TIMES');
                this.input_.appendField('раз', 'TIMES');
            },

            toCommand: function(parent) {
                var args = this.getArgValues();
                var cmd = new CommandsMode.ForStmt(null, args, parent, this, problem);
                var cmBlock = this.inputToCMBlock_('DO', cmd);
                cmd.setBody(cmBlock);
                return cmd
            }
        });

        Blocks['funcdef'] = $.inherit(SimpleBlock, $.extend({}, Blockly.Blocks['procedures_defnoreturn'], {
            /**
            * Function definition.
            */
            init: function() {
                this.setColour(290);
                var name = Blockly.Procedures.findLegalName('Func1', this);
                this.appendDummyInput()
                    .appendField('Функция')
                    .appendField(new Blockly.FieldTextInput(name, Blockly.Procedures.rename), 'NAME')
                    .appendField('', 'PARAMS');
                this.appendStatementInput('DO')
                    .appendField(Blockly.Msg.PROCEDURES_DEFNORETURN_DO);
                this.setMutator(new Blockly.Mutator(['procedures_mutatorarg']));
                this.setTooltip(Blockly.Msg.PROCEDURES_DEFNORETURN_TOOLTIP);
                this.arguments_ = [];
            },

            callType_: 'funccall',

            toCommand: function(parent) {
                var name = this.getFieldValue('NAME');
                var args = [];
                // this.arguments_ doesnt have patched prototype from Misc.js somewhy.
                for (var i = 0, a; a = this.arguments_[i]; ++i)
                    args.push(a);
                var cmFunc = new CommandsMode.FuncDef(name, args, [], parent, this, problem);
                var cmBlock = this.inputToCMBlock_('DO', cmFunc);
                cmFunc.body = cmBlock;
                cmFunc.setCommands(cmBlock.commands);

                if (!problem.functions[name])
                    problem.functions[name] = [];
                problem.functions[name][args.length] = cmFunc;
                return cmFunc;
            }
        }));

        Blocks['funccall'] = $.inherit(FuncCallBlock, $.extend({}, Blockly.Blocks['procedures_callnoreturn'], {
            init: function() {
                this.setColour(290);
                this.appendDummyInput()
                    .appendField(Blockly.Msg.PROCEDURES_CALLNORETURN_CALL)
                    .appendField('', 'NAME');
                this.setPreviousStatement(true);
                this.setNextStatement(true);
                this.setInputsInline(true);
                // Tooltip is set in domToMutation.
                this.arguments_ = [];
                this.savedValues = {};
            },

            getArgsDict_: function() {
                var argsDict = {};
                var input = this.getInput('ARG')
                if (!input)
                    return argsDict;

                for (var i = 0, field; field = input.fieldRow[i]; i += 2) {
                    var argName = field.getValue();
                    var inputValue = input.fieldRow[i + 1];
                    if (inputValue) {
                        argsDict[argName] = inputValue.getValue();
                    }
                }
                return argsDict
            },

            setProcedureParameters: function(paramNames, paramIds) {
                if (paramIds && paramIds.length != paramNames.length)
                {
                    throw 'Error: paramNames and paramIds must be the same length.';
                }

                // Switch off rendering while the block is rebuilt.
                var savedRendered = this.rendered;
                this.rendered = false;

                // Rebuild the block's arguments.
                var input = this.getInput('ARG');
                this.savedValues = $.extend(this.savedValues, this.getArgsDict_());

                if (input)
                    this.removeInput('ARG');

                this.arguments_ = [].concat(paramNames);
                var input = this.appendDummyInput('ARG')
                    .setAlign(Blockly.ALIGN_RIGHT)
                for (var i = 0; i < this.arguments_.length; i++) {
                    var argName = this.arguments_[i];
                    input.appendField(argName);

                    var argValue = this.savedValues[argName]
                    if (!argValue)
                        argValue = '0';
                    input.appendField(new Blockly.FieldTextInput(argValue, Blockly.FieldTextInput.numberValidator), this.arguments_[i])
                }
                // Restore rendering and show the changes.
                this.rendered = savedRendered;
                if (this.rendered) {
                    this.render();
                }
            },

            getArgValues: function() {
                var l = [];
                var input = this.getInput('ARG')
                if (!input)
                    return l;

                for (var i = 1, field; field = input.fieldRow[i]; i += 2) {
                    var value = field.getValue();
                    l.push(value);
                }
                return l;
            },

            toCommand: function(parent) {
                var args = this.getArgValues();
                var name = this.getFieldValue('NAME')
                var cmd = new CommandsMode.FuncCall(name, args, parent, this, problem);
                return cmd
            }
        }));

        Blocks['funcdefmain'] = $.inherit(SimpleBlock, {
            /**
            * Main function definition.
            */
            init: function() {
                this.appendDummyInput().appendField('Главная функция');
                this.setColour(0);
                this.appendStatementInput('DO')
                    .appendField(Blockly.Msg.PROCEDURES_DEFNORETURN_DO);
                this.arguments_ = [];
                this.setDeletable(false);
                this.setMovable(false);
            },

            toCommand: function(parent) {
                var cmBlock = this.inputToCMBlock_('DO', parent)
                return cmBlock
            }
        });

        // Pourer blocks
        Blocks['pour'] = $.inherit(CommandBlock, {
            init: function() {
                this.__base('pour');
            }
        });

        Blocks["pourOut"] = $.inherit(CommandBlock, {
            init: function() {
                this.__base('pourOut');
            }
        });
        Blocks["fill"] = $.inherit(CommandBlock, {
            init: function() {
                this.__base('fill');
            }
        });

        // ArrowInLabyrinth
        Blocks['isCompleted'] = $.inherit(CommandBlock, {
            init: function() {
                this.__base('isCompleted');
            }
        });

        Blocks['objectPosition'] = $.inherit(CommandBlock, {
            init: function() {
                this.__base('objectPosition');
            }
        });

        Blocks['forward'] = $.inherit(CommandBlock, {
            init: function() {
                this.__base('forward');
            }
        });

        Blocks['left'] = $.inherit(CommandBlock, {
            init: function() {
                this.__base('left');
            }
        });

        Blocks['right'] = $.inherit(CommandBlock, {
            init: function() {
                this.__base('right');
            }
        });

        Blocks['wait'] = $.inherit(CommandBlock, {
            init: function() {
                this.__base('wait');
            }
        });


        // Generate
        var genBlocks = {};
        for (var name in Blocks) {
            if (requiredBlocks.indexOf(name) != -1) {
                genBlocks[name] = new Blocks[name](problem)
            }
        }

        return genBlocks;
    }


    return {
        generate: generate,
    };
});

/*
Blockly.Blocks[''] = {
    "block": {
    "if": {
    "ifelse": {
    "else": {
    "while": {
    "for": {
    "funccall": {
    "func-header": {
    "func-body": {
}
*/
