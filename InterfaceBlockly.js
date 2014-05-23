/**
 * Blockly interface between user and JSTree.
 */

define('InterfaceBlockly', ['Blocks', 'InterfaceJSTree', 'Problems'], function() {
    var Problems = require('Problems');
    var Blocks = require('Blocks');

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



    function initMenu(problem) {
        var Blockly = problem.Blockly;
        var $blocks = $(Blockly.languageTree).find('block');
        $(Blockly.Toolbox.HtmlDiv).remove();

        // Vertical menu. Fix position and metrics.
        verticalMenu = new Blockly.Flyout();
        var position_ = verticalMenu.position_;
        verticalMenu.position_ = function() {
            position_.call(this);
            if (this.svgGroup_)
                this.svgGroup_.setAttribute('transform', 'translate(0, 0)');
        }
        Blockly.Toolbox.flyout_.dispose()
        Blockly.Toolbox.flyout_ = verticalMenu;
        var svgGroup = Blockly.Toolbox.flyout_.createDom();
        Blockly.svg.appendChild(svgGroup);
        Blockly.Toolbox.flyout_.init(Blockly.mainWorkspace, true)

        // Horisontal menu.
        horizontalMenu = new Blockly.Flyout();
        horizontalMenu.createBlockFunc_ = function(type, image) {
            var flyout = this;
            return function(e) {
                if (Blockly.isRightButton(e)) {
                  // Right-click.  Don't create a block.
                  return;
                }
                var block = Blockly.Block.obtain(Blockly.mainWorkspace, type);
                block.initSvg();
                block.render();

                var xyOld = Blockly.getSvgXY_(image);
                var svgRootNew = block.getSvgRoot();
                var xyNew = Blockly.getSvgXY_(svgRootNew);
                block.moveBy(xyOld.x - xyNew.x, xyOld.y - xyNew.y);
                block.onMouseDown_(e);
            }
        }
        var group = Blockly.createSvgElement('g', {
            'transform': 'translate(0, -42)',
            'style': 'background-color: #ddd'}, null);
        var text = Blockly.createSvgElement('text', {'class': 'blocklyText',
            'style': 'fill: #000;', 'x': 22, 'y': 21}, group);
        var rect = Blockly.createSvgElement('rect', { 'width': 100,'height': 32,
            'class': 'blocklyHorizontalMenuItem'}, group);
        text.appendChild(document.createTextNode('Создать'));
        horizontalMenu.listeners_.push(Blockly.bindEvent_(rect, 'mousedown', null, function(e) {
            setTimeout(function() {
                var tree = Blockly.Toolbox.tree_;
                tree.setSelectedItem(tree.children_[0]);
            }, 1)
        }));

        // render menu items
        $blocks.each(function(index, value) {
            var type = $(value).attr('type');
            var x = 100 + 10 +index * 40

            var image = document.createElementNS('http://www.w3.org/2000/svg','image');
            image.setAttribute('height','32');
            image.setAttribute('width','32');
            image.setAttributeNS('http://www.w3.org/1999/xlink','href','images/' + type + '.png');
            image.setAttribute('x', x);
            image.setAttribute('y', 0);
            group.appendChild(image)

            var rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
            rect.setAttribute('class', 'blocklyHorizontalMenuItem')
            rect.setAttribute('height','32');
            rect.setAttribute('width','32');
            rect.setAttribute('rx', 4);
            rect.setAttribute('ry', 4);
            rect.setAttribute('x', x);
            group.appendChild(rect)

            horizontalMenu.listeners_.push(Blockly.bindEvent_(rect, 'mousedown', null,
                horizontalMenu.createBlockFunc_(type, image)));
        })
        Blockly.mainWorkspace.getCanvas().insertBefore(group);

        // fix position of main workspace
        $(Blockly.mainWorkspace.getCanvas()).attr('transform', 'translate(10, 48)')

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
            var category = $('<category/>', {name: 'Создать'});
            toolbox.append(category)
            for (var i = 0, cmd; cmd = allowedCommands[i]; i++) {
                if (cmd == "funcdefmain") {
                    continue
                }
                category.append($('<block/>', {type: cmd}));
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

            initMenu(problem, Blockly);

            //Bind 'onchange' event to problem.updated
            var bindData = Blockly.bindEvent_(Blockly.mainWorkspace.getCanvas(),
                'blocklyWorkspaceChange', problem, problem.updated);
        },
    };
});
