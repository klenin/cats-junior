/**
 * Blockly interface between user and JSTree.
 */
'use strict';


define('InterfaceBlockly', ['Blocks', 'InterfaceJSTree', 'Problems'], function() {
    var Problems = require('Problems');
    var Blocks = require('Blocks');
    var arrBlockly = [];  // one blockly instance for each problem

    // // Custom menu
    // var initMenu = function(problem, Blockly) {
    //     // init list of allowed commands
    //     var allowedCommands = ('controlCommands' in problem ? problem.controlCommands : Problems.classes);
    //     var executionUnitCommands = problem.executionUnit.getCommandsToBeGenerated();
    //     allowedCommands.splice(allowedCommands.indexOf("block"), 1);
    //     for (var i = 0; i < executionUnitCommands.length; ++i) {
    //         allowedCommands.push(executionUnitCommands[i].commandClass)
    //     }

    //     //
    //     var workspace = new Blockly.Workspace(
    //         function() {return flyout.getMetrics_();},
    //         function(ratio) {return flyout.setMetrics_(ratio);});


    //     // init blocks
    //     var blocks = []
    //     for (var i = 0, cmd; cmd = allowedCommands[i]; i++) {
    //         block = Blockly.Block.obtain(Blockly.mainWorkspace, cmd);
    //         blocks.push(block);
    //     }

    //     // set position
    //     for (var i = 0, block; block = blocks[i]; i++) {
    //         block.initSvg();
    //         block.render();
    //     }

    // };

    return {
        // Array of Blockly instances. One for each problem.
        arrBlockly: arrBlockly,

        injectBlockly: function(problem) {
            /**
            * Inject Blockly into 'iframe' container.
            */
            var $container = $('#blockly-container-' + problem.tabIndex);
            var Blockly = arrBlockly[problem.tabIndex] = $container[0].contentWindow.Blockly;
            Blockly.problem = problem;
            problem.Blockly = Blockly;

            // Make list of allowed commands.
            var allowedCommands = ('controlCommands' in problem ?
                problem.controlCommands :
                ['if', 'ifelse', 'while', 'for', 'funcdef']);
            var executionUnitCommands = problem.executionUnit.getCommandsToBeGenerated();
            allowedCommands.splice(allowedCommands.indexOf("block"), 1);
            for (var i = 0; i < executionUnitCommands.length; ++i) {
                allowedCommands.push(executionUnitCommands[i].commandClass)
            }

            // Define toolbox.
            var toolbox = $('<xml/>', {id: 'toolbox', style: 'display: none'})
            for (var i = 0, cmd; cmd = allowedCommands[i]; i++) {
                if (cmd == "funcdefmain") {
                    continue
                }
                toolbox.append($('<block/>', {type: cmd}));
            }

            // Generate blocks.
            var reqBlocks = allowedCommands.slice()
            reqBlocks.push('funcdefmain')
            var blocks = Blocks.generate(problem, reqBlocks);
            $.extend(Blockly.Blocks, blocks);

            Blockly.inject($container[0].contentDocument.body, {
                path: 'import/blockly/',
                toolbox: toolbox[0],
                rtl: false,
                scrollbars: false,
                trashcan: true
            });

            // Create and render block for main function.
            var block = problem.mainBlock = Blockly.Block.obtain(Blockly.mainWorkspace, 'funcdefmain');
            block.initSvg();
            block.render();

            // initMenu(problem, Blockly);

            //Bind 'onchange' event to problem.updated
            var bindData = Blockly.bindEvent_(Blockly.mainWorkspace.getCanvas(),
                'blocklyWorkspaceChange', problem, problem.updated);

        },
    };
});
