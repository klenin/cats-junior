/**
 * Patch Blockly messages.
 * Original is at ./import/blockly/msg/js/ru.js
 */
'use strict';

define('BlocklyMsg', [], function() {
    function update(Blockly) {
        Blockly.Msg.PROCEDURES_DEFNORETURN_PROCEDURE = "do";  //"выполнить что-то";
        Blockly.Msg.PROCEDURES_DEFNORETURN_TITLE = "Подпрограмма";  //"чтобы";
        Blockly.Msg.VARIABLES_DEFAULT_NAME = "x";  //"элемент";
        Blockly.Msg.VARIABLES_GET_ITEM = "x";
    }

    return {
        update: update
    }
})
