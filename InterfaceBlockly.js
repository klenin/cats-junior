/**
 * Blockly interface between user and JSTree.
 */

define('InterfaceBlockly', ['Blocks', 'InterfaceJSTree', 'Problems',
    'BlocklyMisc', 'BlocklyMsg', 'BlocklyPython', 'BlocklyExecutor'], function() {

    var Problems = require('Problems');
    var Blocks = require('Blocks');
    var CommandsMode = require('CommandsMode');
    var BlocklyPython = require('BlocklyPython');
    var BlocklyMsg = require('BlocklyMsg');
    var BlocklyMisc = require('BlocklyMisc');
    var BlocklyExecutor = require('BlocklyExecutor');

    function initMenu(problem) {
        var Blockly = problem.Blockly;
        var $blocks = $(Blockly.languageTree).find('block');
        $(Blockly.Toolbox.HtmlDiv).hide();

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
                block.moveBy(xyOld.x - xyNew.x - 30, xyOld.y - xyNew.y);
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
        var $canvas = $(Blockly.mainWorkspace.getCanvas())
        $(group).appendTo($canvas);

        // fix position of main workspace
        $canvas.attr('transform', 'translate(10, 48)')

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
            BlocklyMisc.update(Blockly);
            BlocklyPython.update(Blockly);
            BlocklyMsg.update(Blockly);
            BlocklyExecutor.update(Blockly);

            Blockly.problem = problem;
            problem.Blockly = Blockly;


            // Make list of allowed commands.
            var allowedCommands = []
            var executionUnitCommands = problem.executionUnit.getCommandsToBeGenerated();
            for (var i = 0; i < executionUnitCommands.length; ++i) {
                allowedCommands.push(executionUnitCommands[i].commandClass)
            }
            var controlCommands = ('controlCommands' in problem ?
                problem.controlCommands :
                ['if', 'ifelse', 'while', 'for', 'funcdef', 'math_number']);
            allowedCommands = allowedCommands.concat(controlCommands);
            var idxBlock = allowedCommands.indexOf("block");
            if (idxBlock != -1)
                allowedCommands.splice(idxBlock, 1);

            // Generate blocks.
            var reqBlocks = allowedCommands.slice()
            reqBlocks.push('funcdefmain');
            if (reqBlocks.indexOf('funcdef') != -1)
                reqBlocks.push('funccall');
            var blocks = Blocks.generate(problem, reqBlocks);
            $.extend(Blockly.Blocks, blocks);

            // Define toolbox.
            var toolbox = $('<xml/>', {id: 'toolbox', style: 'display: none'})
            var category = $('<category/>', {name: 'Создать'});
            toolbox.append(category)
            for (var i = 0, cmd; cmd = allowedCommands[i]; i++) {
            // for (cmd in Blockly.Blocks) {
                if (cmd == "funcdefmain") {
                    continue
                }
                category.append($('<block/>', {type: cmd}));
            }

            Blockly.inject($container[0].contentDocument.body, {
                path: 'import/blockly/',
                toolbox: toolbox[0],
                rtl: false,
                scrollbars: false,
                trashcan: true
            });
            initMenu(problem, Blockly);

            // // Blockly.bindEvent_(Blockly.svg, 'mousedown', problem, problem.updated);
            $container.contents().find("body").on('mousedown mouseup', function(e) {
                problem.updated();
            })

            problem.blocklyExecutor = new Blockly.Executor;
            problem.blocklyExecutor.setDefault();

            //Bind 'onchange' event to problem.updated
            // problem.bindUpdated();
            // problem.unbindUpdated();
        },
    };
});
