/**
 * Blocks set-up
 */
'use strict';


define('Blocks', ['Problems', 'BlocklyPython', 'BlocklyMsg', 'Exceptions'], function() {
    var Exceptions = require('Exceptions');
    var IncorrectInput = Exceptions.IncorrectInput;

    function generate(problem, requiredBlocks) {
        /**
        *  Generate blocks for problem.
        */

        var Blockly = problem.Blockly;

        var SimpleBlock = $.inherit({
            __constructor: function(problem) {
                this.problem = problem;

                // Inherit also from original Blockly.Block if required.
                if (this.originType) {
                    this.originBlock = Blockly.Blocks[this.originType];
                    $.extend(this, $.extend({}, this.originBlock, this));
                }
            },

            __origin: function(method, args) {
                /**
                * Execute method of original Blockly.Block.
                */
                if (!args)
                    args = [];

                if (this.originBlock && this.originBlock[method]) {
                    return this.originBlock[method].apply(this, args);
                }
            },

            init: function() {
                this.__origin('init');
                this.setInputsInline(true);

                // Execution.
                this.argsDict = {};
                this.execState = {};
                // this.originalXY = this.getRelativeToSurfaceXY();
            },

            execStep: function() {
                if (!this.execState.argBlocksHandled) {
                    this.execState.argBlocksHandled = true;
                    var argBlocks = this.getArgBlocks();
                    if (argBlocks.length) {
                        // need to execute arguments first
                        problem.blocklyExecutor.blocks.push(this);
                        problem.blocklyExecutor.pushReversedList(argBlocks, this.execCloneArgs)
                        return
                    }
                }
                return this.execStepPrepared();
            },

            execStepPrepared: function() {
            },

            cloneBeforeExec: function(inheritState, cloneArgsDict) {
                /**
                * Replace this block with clone before execution.
                */
                if (!this.originalXY)
                    this.originalXY = this.getRelativeToSurfaceXY();

                var newBlock = this.duplicate_()
                newBlock.savedBlock_ = this;
                newBlock.moveTo(this.originalXY.x, this.originalXY.y);  // NOTE: hide by moving away. Correct solution would be to dispose svg of the block and restore when needed.
                this.replace(newBlock);

                newBlock.updateFrom_(this, cloneArgsDict);
                newBlock.originalXY = this.originalXY;
                var descendants = newBlock.getDescendants();
                for (var i = 0, block; block = descendants[i]; ++i) {
                    block.argsDict = this.argsDict;
                }

                return newBlock;
            },

            restoreAfterExec: function() {
                if (!this.savedBlock_)
                    // Block was cloned indirectly. It will be restored when
                    // parent is restored.
                    return

                // Restore position.
                var xy = this.getRelativeToSurfaceXY();
                var savedBlock = this.savedBlock_;
                savedBlock.moveTo(xy.x, xy.y);
                this.replace(this.savedBlock_);
                this.moveTo(200, 200);  // DEBUG:

                // Restore highlighting.
                var wasHighlighted = this.getSvgRoot().getAttribute('class').indexOf('blocklyCurrentCommand') > -1;
                if (wasHighlighted)
                    Blockly.highlight(savedBlock);

                if (!this.saveAfterRestore__) {  // DEBUG: NOTE: saveAfterRestore__ is not used. Block must be disposed always. Check can be removed.
                    this.dispose();
                }
                return savedBlock;
            },

            mutationToDom: function() {
                var container = this.__origin('mutationToDom');

                if (this.execUniqueID) {
                    if (!container) {
                        container = document.createElement('mutation');
                    }
                    container.setAttribute('execuniqueid', this.execUniqueID);
                }
                return container;
            },

            domToMutation: function(xmlElement) {
                var execUniqueID = xmlElement.getAttribute('execuniqueid');
                if (execUniqueID) {
                    this.execUniqueID = execUniqueID;
                }
                xmlElement.removeAttribute('execuniqueid');

                this.__origin('domToMutation', [xmlElement]);
            },

            getId: function() {
                return this.execUniqueID;
            },

            addDelayedRemove_: function(block, reducedBlock) {
                problem.blocklyExecutor.delayedRemoveBlocks.push(block);
                if (block.savedBlock_)
                    reducedBlock.savedBlock_ = block.savedBlock_;
            },

            addDelayedRestore_: function(block) {
                problem.blocklyExecutor.delayedRestoreBlocks.push(block);
            },

            getArgBlocks: function() {
                var blocks = [];

                for (var i = 0, input; input = this.inputList[i++];) {
                    if (input.type != Blockly.INPUT_VALUE)
                        continue
                    var block = input.connection.targetBlock();
                    if (block)
                        blocks.push(block);
                }
                return blocks;
            },

            decreaseCounterNow: function(forced) {
                if (this.execState.decreased && !forced)
                    return false
                problem.blocklyExecutor.blocks.push(this)
                this.execState.decreased = true
                return true
            },

            saveBlock: function(forceUpdate) {
                // do not update data if already saved and no force flag given
                if (this.xmlBlock_)
                    if (!forceUpdate)
                        return

                this.xmlBlock_ = Blockly.Xml.blockToDom_(this);

            },

            restoreBlock: function() {
                if (!this.xmlBlock_) {
                    return
                }
                thix.xmlBlock_ = Blockly.Xml.domToBlock_(this);
            },

            updateFrom_: function(block, cloneArgsDict) {
                if (cloneArgsDict) {
                    this.argsDict = $.extend({}, block.argsDict);
                } else {
                    if (!block.argsDict)
                        block.argsDict = {};
                    this.argsDict = block.argsDict;
                }

                // Always clone execState;
                this.execState = $.extend({}, block.execState);
            },

            replace: function(block) {
                /**
                * Disconnect self, connect block.
                * @arg block - Blockly.Block or xml representation.
                */
                if (!block.getFieldValue) {
                    block = Blockly.Xml.domToBlock(Blockly.mainWorkspace, block);
                    block.updateFrom_(this);
                    this.replacingBlock_ = block;
                }

                if (this.nextConnection && this.nextConnection.targetConnection) {
                    var c = this.nextConnection.targetConnection;
                    this.nextConnection.targetBlock().setParent(null);
                    c.connect(block.nextConnection);
                }
                if (this.previousConnection && this.previousConnection.targetConnection) {
                    var c = this.previousConnection.targetConnection;
                    this.setParent(null);
                    c.connect(block.previousConnection);
                }
                if (this.outputConnection && this.outputConnection.targetConnection) {
                    var c = this.outputConnection.targetConnection;
                    this.setParent(null);
                    c.connect(block.outputConnection);
                }

                // hide block (redo)
                this.moveTo(10000, 10000);
                // debug
                // this.dy = ( this.dy ? this.dy + 5 : 0);
                // this.moveTo(450, this.dy);

                return block;
            },

            getBlocksList: function(input) {
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
                var fType = new Blockly.FieldDropdown(condTypes, this.typeChangeHandler);
                this.inputCondition_.appendField(fType, 'ARG0');
                // - fields for each type
                this.rebuildArgumentFields_(this.inputCondition_, conditionProperties[0].name, 1);
                this.currentCondType_ = this.getFieldValue('ARG0');
            },

            getConditionProperties: function() {
                if (this.cpDict_)
                    return this.cpDict_;

                this.cpDict_ = {}
                var cpList = this.problem.executionUnit.getConditionProperties()
                for (var i = 0, func; func = cpList[i]; ++i) {
                    this.cpDict_[func.name] = func;
                }
                return this.cpDict_;
            },

            typeChangeHandler: function(condType) {
                var block = this.sourceBlock_;
                if (condType != block.currentCondType_) {
                    block.currentCondType_ = condType;
                    block.rebuildArgumentFields_(block.inputCondition_, condType, 1);
                }
                return condType;
            },

            rebuildArgumentFields_: function(input, condType, nSkip) {
                /**
                * Clean 'argX' fields for block and build them again.
                * @param input - Blockly.Input, fields container.
                * @param args - list of ExecutionUnitCommands.CommandArgument.
                * @param nSkip - number of fields to skip (e.g. ConditionalBlock
                *   has 2 constant Fields).
                */
                if (!nSkip) nSkip = 0;
                this.currentCondType_ = condType;
                this.setFieldValue(condType, 'ARG0');
                var args = this.getConditionProperties()[condType].args;

                // Remove fields.
                for (var i = nSkip, field; field = this.getField_('ARG' + i); ++i) {
                    input.removeField('ARG' + i);
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
                    input.appendField(field, 'ARG' + (nSkip + i));
                }
            },
        });


        var FuncCallBlock = $.inherit(SimpleBlock, {
        });


        var CommandBlock = $.inherit(FuncCallBlock, {
            init: function(name) {
                this.__base();
                this.name = name;
                this.setColour(0);
                this.appendArgs_(name);
                this.setPreviousStatement(true);
                this.setNextStatement(true);
                Blockly.Python[name] = Blockly.Python['command_'];
            },

            execStepPrepared: function() {
                // petalty for command;
                this.problem.recalculatePenalty(this);

                for (var x = 0, values = [], input; input = this.getInput('ARG' + x); x++) {
                    var targetBlock = input.connection.targetBlock()
                    if (!targetBlock)
                        throw new IncorrectInput('Некорректный аргумент.');
                    values.push(targetBlock.getValue());
                }

                if (this.counterInput_ == undefined) {
                    this.counterInput_ = this.getCounterInput();
                }

                if (this.counterInput_ == null) {
                    // command without counter
                    this.problem.oneStep(this.name, 1, values);
                    problem.blocklyExecutor.delayedRestoreBlocks.push(this);
                    return true;
                } else {
                    var targetBlock = this.counterInput_.connection.targetBlock();
                    if (!targetBlock)
                        throw new IncorrectInput('Некорректный аргумент.');
                    var counterValue = parseInt(targetBlock.getFieldValue('NUM'));
                    targetBlock.setFieldValue((counterValue - 1).toString(), 'NUM');
                    if (counterValue > 0)  {
                        this.problem.oneStep(this.name, 1, values);
                        problem.blocklyExecutor.blocks.push(this);
                        return true;
                    } else {
                        problem.blocklyExecutor.delayedRestoreBlocks.push(this);
                        return false;
                    }
                }
            },

            getCounterInput: function() {
                var euCommands = this.problem.getCommands();
                for (name in euCommands) {
                    var func = euCommands[name];
                    if (func.hasCounter) {
                        for (var i = 0, arg; arg = func.arguments[i]; ++i) {
                            if (arg.isCounter) {
                                return this.getInput('ARG' + i);
                            }
                        }
                    }
                }
                return null;
            },

            appendArgs_: function(name) {
                this.name_ = name;
                this.text_ = this.problem.executionUnit.executionUnit.__self.cmdClassToName[name]

                this.input_ = this.appendDummyInput()
                    .appendField(this.text_)

                var args = this.problem.executionUnit.getCommands()[name].getArguments()
                if (!args) console.log('Wrong command name is provided to block.');
                for (var i = 0, arg; arg = args[i]; ++i) {
                    this.appendValueInput('ARG' + i)
                        .setCheck("Number");
                }
            }
        });

        var Blocks = {}

        Blocks['conditions'] = $.inherit(ConditionalBlock, {
            init: function() {
                this.__base();
                this.setColour(210);
                this.setOutput(true, "Boolean");
                this.appendArgs();
            },

            execStepPrepared: function() {
                // args
                var args = [''];
                for (var x = 1, arg; arg = this.getFieldValue('ARG' + x); x++) {
                    args[x] = arg;
                }
                var ret = this.getConditionProperties()[this.currentCondType_].jsFunc(args);
                var retBlock = Blockly.Block.obtain(Blockly.mainWorkspace, 'logic_boolean');
                retBlock.initSvg();
                retBlock.render();

                var value = (ret ? 'TRUE' : 'FALSE');
                retBlock.setFieldValue(value, 'BOOL')
                this.replace(retBlock);

                this.addDelayedRemove_(this, retBlock);
                return false
            },

            mutationToDom: function() {
                var container = this.__origin('mutationToDom');
                if (!container) {
                    container = document.createElement('mutation');
                }
                container.setAttribute('type', this.currentCondType_);
                return container;
            },

            domToMutation: function(xmlElement) {
                var type = xmlElement.getAttribute('type');
                if (!type)
                    return
                this.rebuildArgumentFields_(this.inputCondition_, type, 1);
                this.currentCondType_ = type;
            }
        });

        Blocks['if'] = $.inherit(SimpleBlock, {
            originType: 'controls_if',

            init: function() {
                this.__base();
                this.setInputsInline(false);
            },

            execStepPrepared: function() {
                if (this.decreaseCounterNow())
                    // pause before executing body
                    return true

                // find block to execute
                var bodyInput;
                for (var i = 0, inputIf; inputIf = this.getInput('IF' + i); i++) {
                    var checkBlock = inputIf.connection.targetBlock();
                    if (!checkBlock)
                        throw new IncorrectInput('Отсутствует условие.')
                    if (checkBlock.getFieldValue('BOOL') == 'TRUE') {
                        bodyInput = this.getInput('DO' + i);
                        break
                    }
                }
                if (!bodyInput) {
                    bodyInput = this.getInput('ELSE');
                }
                if (!bodyInput) {
                    problem.blocklyExecutor.delayedRestoreBlocks.push(this);
                    return
                }

                if (!this.execState.bodyExecuted) {
                    this.execState.bodyExecuted = true;
                    var blocks = this.getBlocksList(bodyInput);
                    if (blocks.length) {
                        // Execute body first
                        problem.blocklyExecutor.blocks.push(this);
                        problem.blocklyExecutor.pushReversedList(blocks, true);
                        return
                    }
                }
                problem.blocklyExecutor.delayedRestoreBlocks.push(this);
                return
            }
        });

        Blocks['ifelse'] = $.inherit(Blocks['if'], {
            init: function() {
                this.__base();
                this.setInputsInline(false);

                this.appendStatementInput('ELSE')
                    .appendField(Blockly.Msg.CONTROLS_IF_MSG_ELSE);
                // this.mutationToDom();
            }
        });

        Blocks['while'] = $.inherit(SimpleBlock, {
            originType: 'controls_whileUntil',

            init: function() {
                this.__base();
                this.setInputsInline(false);
            },

            execCloneArgs: true,  // We need to restore test condition to execute it later.
            execStepPrepared: function() {
                if (this.execState.loopStage == 'COND' || !this.execState.loopStage) {
                    this.execState.loopStage = 'BODY';

                    // check condition
                    var checkBlock = this.getInput('BOOL').connection.targetBlock();
                    if (!checkBlock)
                        throw new IncorrectInput('Отсутствует условие.');
                    var stop = checkBlock.getFieldValue('BOOL') == 'FALSE';
                    var mode = this.getFieldValue('MODE')
                    if (mode == 'UNTIL') {
                        stop = !stop;
                    }
                    if (stop) {
                        problem.blocklyExecutor.delayedRestoreBlocks.push(this);
                    } else {
                        problem.blocklyExecutor.blocks.push(this);
                    }
                    return true
                } else {
                    this.execState.loopStage = 'COND';

                    // one more cycle
                    var checkBlock = this.getInput('BOOL').connection.targetBlock();
                    if (!checkBlock)
                        throw new IncorrectInput('Отсутствует условие.');
                    problem.blocklyExecutor.delayedRestoreBlocks.push(checkBlock);

                    this.execState.argBlocksHandled = false;
                    var blocks = this.getBlocksList('DO');
                    if (blocks.length) {
                        // Execute body first
                        problem.blocklyExecutor.blocks.push(this);
                        problem.blocklyExecutor.pushReversedList(blocks, true);
                    }
                }

            }
        });

        Blocks['for'] = $.inherit(SimpleBlock, {
            originType: 'controls_repeat_ext',

            init: function() {
                this.__base();
                this.setInputsInline(false);
            },
            // execCloneArgs: true,  // We need to restore test condition to execute it later.
            execStepPrepared: function() {
                if (this.execState.loopStage == 'COND' || !this.execState.loopStage) {
                    this.execState.loopStage = 'BODY';

                    // check condition
                    var checkBlock = this.getInput('TIMES').connection.targetBlock();
                    if (!checkBlock)
                        throw new IncorrectInput('Отсутствует счетчик');
                    if (this.stopValue == undefined) {
                        this.stopValue = parseInt(checkBlock.getFieldValue('NUM'));
                    }
                    var stop = this.stopValue <= 0;
                    if (stop) {
                        problem.blocklyExecutor.delayedRestoreBlocks.push(this);
                        checkBlock.setFieldValue((this.stopValue--).toString(), 'NUM');
                    } else {
                        problem.blocklyExecutor.blocks.push(this);
                        checkBlock.setFieldValue((this.stopValue--).toString(), 'NUM');
                    }
                    return true
                } else {
                    this.execState.loopStage = 'COND';

                    // one more cycle
                    var checkBlock = this.getInput('TIMES').connection.targetBlock();
                    if (!checkBlock)
                        throw new IncorrectInput('Отсутствует счетчик.');
                    // problem.blocklyExecutor.delayedRestoreBlocks.push(checkBlock);

                    this.execState.argBlocksHandled = false;
                    var blocks = this.getBlocksList('DO');
                    if (blocks.length) {
                        // Execute body first
                        problem.blocklyExecutor.blocks.push(this);
                        problem.blocklyExecutor.pushReversedList(blocks, true);
                        return
                    }
                }
            }
        });

        Blocks['math_number'] = $.inherit(SimpleBlock, {
            originType: 'math_number',

            init: function() {
                this.__base();
            },

            getValue: function() {
                return Number(this.getFieldValue('NUM'));
            }
        });

        Blocks['math_arithmetic'] = $.inherit(SimpleBlock, {
            originType: 'math_arithmetic',

            init: function() {
                this.__base();
            },

            execStepPrepared: function() {
                var blockA = this.getInput('A').connection.targetBlock();
                var blockB = this.getInput('B').connection.targetBlock();
                if (!blockA || !blockB)
                    throw new IncorrectInput('Некорректный аргумент.');
                var valueA = parseFloat(blockA.getFieldValue('NUM'));
                var valueB = parseFloat(blockB.getFieldValue('NUM'));
                var valueOp = this.getFieldValue('OP');

                if (valueOp == 'ADD') {
                    var newValue = valueA + valueB;
                } else if (valueOp == 'MINUS') {
                    var newValue = valueA - valueB;
                } else if (valueOp == 'MULTIPLY') {
                    var newValue = valueA * valueB;
                } else if (valueOp == 'DIVIDE') {
                    if (valueB == 0)
                        throw new IncorrectInput('Деление на ноль.')
                    var newValue = valueA / valueB;
                } else if (valueOp == 'POWER') {
                    var newValue = Math.pow(valueA, valueB);
                } else {
                    throw new IncorrectInput('Некорректный операнд сравнения');
                }

                var block = Blockly.Block.obtain(Blockly.mainWorkspace, 'math_number');
                block.initSvg();
                block.render();
                block.setFieldValue(newValue.toString(), 'NUM');
                this.replace(block);

                this.addDelayedRemove_(this, block);
                return true;
            }
        });

        Blocks['logic_negate'] = $.inherit(SimpleBlock, {
            originType: 'logic_negate',

            init: function() {
                this.__base();
                this.setInputsInline(false);
            },

            execStepPrepared: function() {
                var blockArg = this.getInput('BOOL').connection.targetBlock();
                if (!blockArg)
                    throw new IncorrectInput('Некорректный аргумент.');
                var newValue = (blockArg.getFieldValue('BOOL') == 'TRUE' ? 'FALSE' : 'TRUE');

                var block = Blockly.Block.obtain(Blockly.mainWorkspace, 'logic_boolean');
                block.initSvg();
                block.render();
                block.setFieldValue(newValue, 'BOOL')
                this.replace(block);

                this.addDelayedRemove_(this, block);
                return false;
            }
        });

        Blocks['logic_boolean'] = $.inherit(SimpleBlock, {
            originType: 'logic_boolean',

            init: function() {
                this.__base();
            }
        });


        Blocks['logic_operation'] = $.inherit(SimpleBlock, {
            originType: 'logic_operation',

            init: function() {
                this.__base();
                this.setInputsInline(false);
            },

            execStepPrepared: function() {
                var blockA = this.getInput('A').connection.targetBlock();
                var blockB = this.getInput('B').connection.targetBlock();
                if (!blockA || !blockB)
                    throw new IncorrectInput('Некорректный аргумент.');
                var valueA = blockA.getFieldValue('BOOL') == 'TRUE';
                var valueB = blockB.getFieldValue('BOOL') == 'TRUE';
                var valueOp = this.getFieldValue('OP');

                if (valueOp == "AND") {
                    var newValue = valueA && valueB;
                } else {
                    var newValue = valueA || valueB;
                }
                newValue = newValue ? 'TRUE' : 'FALSE';

                var block = Blockly.Block.obtain(Blockly.mainWorkspace, 'logic_boolean');
                block.initSvg();
                block.render();
                block.setFieldValue(newValue, 'BOOL')
                this.replace(block);

                this.addDelayedRemove_(this, block);
                return false
            }
        });

        Blocks['funcdef'] = $.inherit(SimpleBlock, {
            originType: 'procedures_defnoreturn',
            callType_: 'funccall',
            init: function() {
                this.__base();
                this.setInputsInline(false);
            },

            execStepPrepared: function() {
                if (!this.execState.bodyExecuted) {
                    this.execState.bodyExecuted = true;
                    var blocks = this.getBlocksList('STACK');
                    if (blocks.length) {
                        // Execute body first
                        problem.blocklyExecutor.blocks.push(this);
                        problem.blocklyExecutor.pushReversedList(blocks, true);
                        return
                    }
                }

                problem.blocklyExecutor.delayedRestoreBlocks.push(this);
            }
        });

        Blocks['variables_get'] = $.inherit(SimpleBlock, {
            originType: 'variables_get',

            init: function() {
                this.__base();
            },

            execStepPrepared: function() {
                var name = this.getValue();
                if (name in this.argsDict) {
                    var block = this.replace(this.argsDict[name])
                    this.addDelayedRemove_(this, block);
                }
            },

            getValue: function() {
                return this.getFieldValue('VAR');
            }
        });

        Blocks['funccall'] = $.inherit(FuncCallBlock, {
            originType: 'procedures_callnoreturn',

            init: function() {
                this.__base();
            },

            execStepPrepared: function() {
                var stop = this.decreaseCounterNow();
                if (stop)
                    return true

                var funcdef = Blockly.Procedures.getDefinition(this.getProcedureCall(), this.workspace);
                // funcdef.argsDict = $.extend({}, this.argsDict, this.getArgsDict());
                funcdef.argsDict = $.extend({}, this.getArgsDict());
                var block = funcdef.cloneBeforeExec();
                problem.blocklyExecutor.blocks.push(block);

                //fix name
                var name = this.getFieldValue('NAME');
                var field = block.getField_('NAME');
                $(field.getRootElement()).find('text').text(name)

                problem.blocklyExecutor.delayedRestoreBlocks.push(this);
            },

            getArgsDict: function() {
                var argsDict = {}
                for (var i = 0, argName; argName = this.arguments_[i]; ++i) {
                    var block = this.getInput('ARG' + i).connection.targetBlock();
                    if (!block)
                        throw new IncorrectInput('Некорректный аргумент.');
                    argsDict[argName] = Blockly.Xml.blockToDom_(block);
                }
                return argsDict;
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
            genBlocks[name] = new Blocks[name](problem)
            // if (requiredBlocks.indexOf(name) != -1) {
            //     genBlocks[name] = new Blocks[name](problem)
            // }
        }

        return genBlocks;
    }


    return {
        generate: generate,
    };
});
