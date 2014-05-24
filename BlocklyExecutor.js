/**
 *
 */
'use strict';

define('BlocklyExecutor', [], function() {
    function update(Blockly) {
        Blockly.Executor = function(){};

        Blockly.Executor.prototype.setDefault = function() {
            this.blocks = [];
            this.finished = false;
            Blockly.setDefault();
            var topBlocks = Blockly.getMainWorkspace().getTopBlocks().reverse();
            var argsDict = {}
            for (var i = 0, block; block = topBlocks[i]; ++i) {
                if (block.type == 'funcdef' || block.outputConnection)
                    continue
                var blocksStack = [block];
                for (var nextBlock=block; nextBlock = nextBlock.nextConnection.targetBlock();) {
                    blocksStack.push(nextBlock);
                }
                for (var j = blocksStack.length - 1, b; b = blocksStack[j]; --j) {
                    this.blocks.push(b);
                    b.argsDict = argsDict;
                }

            }

            // Remove block at the beginning of the next step. Put blocks here
            // if they were replaced with other (e.g. due to arguments reduction).
            this.delayedRemoveBlocks = [];
            // Restore block at the beginning of the next step.
            this.delayedRestoreBlocks = [];
        };

        Blockly.Executor.prototype.save = function(){
            if (!this.xmlWSBackup) {
                this.xmlWSBackup = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
            }
        }

        Blockly.Executor.prototype.restore = function(){
            if (this.xmlWSBackup) {
                var mainWS = Blockly.mainWorkspace;
                mainWS.clear();
                Blockly.problem.restoreWorkspace(this.xmlWSBackup);
                delete this.xmlWSBackup;
            }
        }

        Blockly.Executor.prototype.exec = function(cmdNumToExecute) {
            // if (!this.blocks.length)
            //     this.setDefault();

            this.save();

            if (this.blocks[0] && !this.blocks[0].savedBlock_) {
                // First exec. Prepare top blocks.
                for (var i = 0, block; block = this.blocks[i]; ++i) {
                    this.blocks[i] = block.cloneBeforeExec()
                }
            }

            while (cmdNumToExecute) {
                // Handle delayed operations
                for (var block; block = this.delayedRemoveBlocks.pop();) {
                    block.dispose();
                }
                for (var block; block = this.delayedRestoreBlocks.pop();) {
                    block.restoreAfterExec();
                }

                var block = this.blocks.pop();
                if (!block) {
                    this.finished = true;
                    Blockly.setDefault();
                    break
                }

                try {
                    var executed = block.execStep()
                } catch (e) {
                    logError(e);
                    this.setDefault();
                    throw(e)
                }

                if (executed) {
                    cmdNumToExecute--;
                    Blockly.highlight(block);
                    if (cmdNumToExecute == 0) {
                        break;
                    }
                }
            }
            return cmdNumToExecute
        };

        Blockly.Executor.prototype.pushList = function(list, clone) {
            for (var i = 0, block; block = list[i]; ++i) {
                if (clone) {
                    block = block.cloneBeforeExec();
                }
                this.blocks.push(block);
            }
        };

        Blockly.Executor.prototype.pushReversedList = function(list, clone) {
            for (var i = list.length - 1, block; block = list[i]; --i) {
                if (clone) {
                    block = block.cloneBeforeExec();
                }
                this.blocks.push(block);
            }
        };
    }

    return {
        update: update
    }
})
