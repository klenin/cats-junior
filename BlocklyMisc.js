/**
 *  Extend Blockly's interface with helper functions.
 */
'use strict';

define('BlocklyMisc', [], function() {
    function update(Blockly) {
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
        };

        Blockly.debugWorkspace = function () {
            /**
            * Debug. Pretty print xml representation of mainWorkspace.
            */
            if (!Blockly.mainWorkspace) {
                return;
            }

            // create node if doesn't exist.
            var $table = $('#cons' + this.Blockly.problem.tabIndex).parent().closest('table');
            var $output = $table.find('.pprint')
            if (!$output.length) {
                $output = $('<tr><td><pre class="pprint cons"></pre></td></tr>').appendTo($table).find('.pprint');
            }

            // workspaceToDom pprint
            var dom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
            var text = Blockly.Xml.domToPrettyText(dom);
            $output.text(text);
        };

        Blockly.organizeWorkspace = function(workspace) {
            /**
            * Organize blocks at workspace.
            */
            if (!workspace)
                workspace = this.mainWorkspace;
            var space = 10;
            var topBlocks = workspace.getTopBlocks();
            var occupiedHeight = 0;
            for (var i = 0, block; block = topBlocks[i]; ++i) {
                var height = block.getHeightWidth().height;
                var xy = block.getRelativeToSurfaceXY();
                var dy = occupiedHeight - xy.y + space;
                var dx = -xy.x;
                block.moveBy(dx, dy);
                occupiedHeight = occupiedHeight + space + block.getHeightWidth().height;
            }
        };

        Blockly.highlight = function(block) {
            if (!block)
                return

            this.highlightOff();
            var svg = block.getSvgRoot();
            if (svg) {
                this.addClass_(svg, "blocklyCurrentCommand");
                this.lastHighlightedBlock_ = block;
            }
        };

        Blockly.highlightOff = function() {
            // unselect
            if (this.selected) {
                this.selected.unselect();
            }

            // remove highlight
            if (!this.lastHighlightedBlock_)
                return
            var svg = this.lastHighlightedBlock_.getSvgRoot();
            if (svg) {
                this.removeClass_(svg, "blocklyCurrentCommand");
            }
        };

        Blockly.setDefault = function() {
            var blocks = this.mainWorkspace.getAllBlocks();
            for (var i = 0, block; block = blocks[i]; ++i) {
                block.argsDict = undefined;
                block.execState = {};
                block.execUniqueID = block.id;
            }
        };

        var onMouseDown_ = Blockly.Block.prototype.onMouseDown_;
        Blockly.Block.prototype.onMouseDown_ = function(e) {
            if (Blockly.problem) {
                Blockly.problem.updated();
            }
            onMouseDown_.call(this, e);
        }
    }

    return {
        update: update
    }
})
