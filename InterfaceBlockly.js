/**
 * Blockly interface between user and JSTree.
 */


define('InterfaceBlockly', ['Blocks', 'InterfaceJSTree', 'Problems'], function() {
    var Problems = require('Problems');
    var Blocks = require('Blocks');

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
    function patchBlockly_(Blockly) {
        /**
        * Extend Blockly's interface with helper functions.
        */

        Blockly.Field.prototype.saveOriginalValue = function(value) {
            /**
            * This method is used to save original value of the field prior to
            * executing commands. Value can be modified during execution. After
            * execution is completed, this value should be restored.
            */
            if (this.originalValue__) {
                return
            }
            if (value === undefined) {
                value = this.getValue();
            }
            this.originalValue__ = value;
        };

        Blockly.Field.prototype.restoreOriginalValue = function() {
            if (this.originalValue__ === undefined) {
                return
            }
            this.setValue(this.originalValue__);
            delete this.originalValue__;
        };

        Blockly.Field.prototype.setRawText = function(text) {
            /**
            * Set unchanged text (ignore validator).
            */
            // Blockly.Field.prototype.setText.call(this, text)
            // set text
            if (text === null || text === this.text_) {
                return;
            }
            this.text_ = text.toString();
            this.updateTextNode_();

            // render
            if (this.sourceBlock_ && this.sourceBlock_.rendered) {
                this.sourceBlock_.render();
                this.sourceBlock_.bumpNeighbours_();
            }
        }
    }

    return {
        injectBlockly: function(problem) {
            /**
            * Inject Blockly into 'iframe' container.
            */
            var $container = $('#blockly-container-' + problem.tabIndex);
            if (!$container[0].contentWindow.Blockly) {
                // Dirty fix. Wait for Blockly to load in iframe.
                var injectBlockly = arguments.callee;
                setTimeout(function() {injectBlockly(problem)}, 50);
                return
            }

            var Blockly = $container[0].contentWindow.Blockly;
            Blockly.problem = problem;
            problem.Blockly = Blockly;
            patchBlockly_(Blockly);

            // Make list of allowed commands.
            var allowedCommands = ('controlCommands' in problem ?
                problem.controlCommands :
                ['if', 'ifelse', 'while', 'for', 'funcdef']);
            var executionUnitCommands = problem.executionUnit.getCommandsToBeGenerated();
            var idxBlock = allowedCommands.indexOf("block");
            if (idxBlock != -1)
                allowedCommands.splice(idxBlock, 1);

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
            reqBlocks.push('funcdefmain');
            if (reqBlocks.indexOf('funcdef') != -1)
                reqBlocks.push('funccall');
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

            // adjust height
            var $svg = $container.contents().find('.blocklySvg');
            var lastHeight, lastWidth;
            function checkForChanges() {
                var flyoutHeight = Blockly.mainWorkspace.flyout_.getMetrics_()['contentHeight'];
                var workspaceHeight = Blockly.mainWorkspace.getCanvas().getBBox().height;
                var newHeight = Math.max(flyoutHeight, workspaceHeight) + 20;
                var newWidth = $svg[0].getBBox().width + 20;
                if (newHeight != lastHeight) {
                    $container.height(newHeight);
                    $container.animate({height: lastHeight}, 0);
                    lastHeight = newHeight;
                }
                if (newWidth != lastWidth) {
                    $container.width(newWidth);
                    $container.animate({width: lastWidth}, 0);
                    lastWidth = newWidth;
                }
                setTimeout(checkForChanges, 50);
            }
            checkForChanges();
        },
    };
});
