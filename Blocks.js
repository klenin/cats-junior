/**
 * Blocks set-up
 */
'use strict';


define('Blocks', ['Problems', 'BlocklyBlockly', 'BlocklyBlocks', 'BlocklyMsg'], function() {

    function generate(problem) {
        /**
        *  Generate blocks for problem.
        */
        Blockly = problem.Blockly

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
                            return opt.reverse().map(function(a) {
                                return a.toString();
                            });
                        })
                        var field = new Blockly.FieldDropdown(opts);
                    } else {
                        // CommandArgumentSpin
                        var field = new Blockly.FieldTextInput('0', Blockly.FieldTextInput.numberValidator);
                    }
                    input.appendField(field, 'arg' + (nSkip + i));
                }
            }

            // DEBUG: workspaceToDom pretty print
            , onchange: function () {
                if (!this.workspace) {
                    return;
                }
                var dom = Blockly.Xml.workspaceToDom(this.workspace);
                var text = Blockly.Xml.domToPrettyText(dom);
                $('#cons' + problem.tabIndex).text(text);
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
                // - custom fields for all types
                this.conditionProperties_ = {}
                for (var i = 0, func; func = conditionProperties[i]; ++i) {
                    this.conditionProperties_[func.name] = func;
                }
                this.rebuildArgumentFields_(this.inputCondition_, conditionProperties[0].args, 2);
            },

            mutationToDom: function() {
                // console.log('mutationToDom')
                var typeCondition = this.getFieldValue('arg0');
                if (typeCondition != this.typeCurrentCondition_) {
                    var args = this.conditionProperties_[typeCondition].args;
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
                this.appendDummyInput('IF0')
                    .appendField('Если');
                this.appendArgs();
                this.appendStatementInput('DO0')
                    .appendField('то');
                this.setPreviousStatement(true);
                this.setNextStatement(true);
            }
        });

        Blocks['ifelse'] = $.inherit(ConditionalBlock, {
            /**
            * Condition "if/else".
            */
            init: function() {
                this.setColour(210);
                this.appendDummyInput('IF0')
                    .appendField('Если');
                this.appendArgs();
                this.appendStatementInput('DO0')
                    .appendField('то');
                this.appendStatementInput('ELSE0')
                    .appendField('иначе');
                this.setPreviousStatement(true);
                this.setNextStatement(true);
            }
        });

        Blocks['while'] = $.inherit(ConditionalBlock, {
            /**
            * Loop "while".
            */
            init: function() {
                this.setColour(210);
                this.appendDummyInput('WHILE0')
                    .appendField('Пока');
                this.appendArgs();
                this.appendStatementInput('DO0')
                this.setPreviousStatement(true);
                this.setNextStatement(true);

            }
        });

        Blocks['for'] = $.inherit(SimpleBlock, {
            /**
            * N times repeat.
            */
            init: function() {
                this.setColour(120);
                this.appendDummyInput()
                    .appendField('Повторить')
                    .appendField(new Blockly.FieldTextInput('10',
                        Blockly.FieldTextInput.nonnegativeIntegerValidator), 'arg0')
                    .appendField('раз');
                this.appendStatementInput('DO')
                this.setPreviousStatement(true);
                this.setNextStatement(true);
            }
        });

        Blocks['funcdef'] = $.inherit(SimpleBlock, $.extend({}, Blockly.Blocks['procedures_defnoreturn'], {
            /**
            * Function definition.
            */
            init: function() {
                this.setColour(290);
                var name = Blockly.Procedures.findLegalName('Функция', this);
                this.appendDummyInput()
                    .appendField(new Blockly.FieldTextInput(name, Blockly.Procedures.rename), 'NAME')
                    .appendField('', 'PARAMS');
                this.appendStatementInput('STACK')
                    .appendField(Blockly.Msg.PROCEDURES_DEFNORETURN_DO);
                this.setMutator(new Blockly.Mutator(['procedures_mutatorarg']));
                this.setTooltip(Blockly.Msg.PROCEDURES_DEFNORETURN_TOOLTIP);
                this.arguments_ = [];
            },

            callType_: 'funccall',
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
                this.quarkConnections_ = null;
                this.quarkArguments_ = null;
            },

            setProcedureParameters: function(paramNames, paramIds) {
                if (!paramIds)
                    return;

                if (paramIds.length != paramNames.length) {
                    throw 'Error: paramNames and paramIds must be the same length.';
                }

                // Switch off rendering while the block is rebuilt.
                var savedRendered = this.rendered;
                this.rendered = false;

                // Rebuild the block's arguments.
                var input = this.getInput('ARG');
                if (input)
                    this.removeInput('ARG');

                this.arguments_ = [].concat(paramNames);
                var input = this.appendDummyInput('ARG')
                    .setAlign(Blockly.ALIGN_RIGHT)
                for (var i = 0; i < this.arguments_.length; i++) {
                    input.appendField(this.arguments_[i]);
                    input.appendField(new Blockly.FieldTextInput('0', Blockly.FieldTextInput.numberValidator), 'arg' + i)
                }
                // Restore rendering and show the changes.
                this.rendered = savedRendered;
                if (this.rendered) {
                    this.render();
                }
            }
        }));

        Blocks['funcdefmain'] = $.inherit(SimpleBlock, {
            /**
            * Main function definition.
            */
            init: function() {
                this.appendDummyInput().appendField('Главная функция');
                this.setColour(0);
                this.appendStatementInput('STACK')
                    .appendField(Blockly.Msg.PROCEDURES_DEFNORETURN_DO);
                this.arguments_ = [];
                this.setDeletable(false);
                this.setMovable(false);
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
            // TODO: generate only necessary blocks.
            genBlocks[name] = new Blocks[name](problem)
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
