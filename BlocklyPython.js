/**
 * Set up python code generation.
 */
'use strict';

define('BlocklyPython', [], function() {
    function update(Blockly) {
        Blockly.Python['if'] = Blockly.Python['controls_if'];
        Blockly.Python['ifelse'] = Blockly.Python['controls_if'];
        Blockly.Python['while'] = Blockly.Python['controls_whileUntil'];
        Blockly.Python['for'] = Blockly.Python['controls_repeat_ext'];
        Blockly.Python['funccall'] = Blockly.Python['procedures_callnoreturn'];

        Blockly.Python['funcdef'] = function(block) {
            var ret = Blockly.Python['procedures_defnoreturn'](block);
            // Do not create global variables;
            Blockly.Python.definitions_.variables = '';
            return ret
        };

        Blockly.Python['command_'] = function(block) {
            // Call a procedure with no return value.
            var funcName = block.type;
            var args = [];
            for (var x = 0, input; input = block.getInput('ARG' + x); x++) {
                args[x] = Blockly.Python.valueToCode(block, 'ARG' + x,  Blockly.Python.ORDER_NONE) || 'None';
            }
            var code = funcName + '(' + args.join(', ') + ')\n';
            return code;
        };

        Blockly.Python['conditions'] = function(block) {
            // Call a procedure with no return value.
            var funcName = block.getFieldValue('ARG0');
            var args = [];
            for (var x = 0, arg; arg = block.getFieldValue('ARG' + (x + 1)); x++) {
                if (!checkNumber(arg))
                    arg = '"' + arg + '"';
                args[x] = arg;
            }
            var code = funcName + '(' + args.join(', ') + ')';
            var order = Blockly.Python.ORDER_ATOMIC;
            return [code, order];
        };
    }

    return {
        update: update
    }
})
