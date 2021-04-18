define('Hanoi', ['jQuery', 'jQueryUI', 'jQueryInherit', 'ExecutionUnitCommands', 'ShowMessages', 'Declaration', 'Exceptions'], function(){
    var ShowMessages = require('ShowMessages');
    var ExecutionUnitCommands = require('ExecutionUnitCommands');
    var Exceptions = require('Exceptions');
    var IncorrectInput = Exceptions.IncorrectInput;
    var InternalError = Exceptions.InternalError;

    var Message = ShowMessages.Message;

    const COL_COUNT = 3;
    const MAX_RINGS = 5;

    let _row_id = function(index) { return 'FieldPyr' + Math.floor(index / COL_COUNT); };

    var Pyramid = $.inherit({

        __constructor: function(rings, index, row, color){
            this.rings = rings;
            this.initRings = rings.clone();
            this.index = index;
            this.init(row, color);
        },

        init: function(row, color) {
            let td = $('<td>').width(100 / COL_COUNT + '%');

            let add_p = function(cls) { return $('<p>').addClass(cls).appendTo(td) };
            add_p('name pole-top').text(this.index + 1);
            let pole = [];
            for (let j = 0; j < MAX_RINGS; j++)
                pole.push(add_p('pole'));
            add_p('base');

            for (let i = 0; i < this.rings.length; i++) {
                let r = this.rings[i];
                if (!r.color) r.color = color;
                $('<div>').width(r.width).appendTo(pole[MAX_RINGS - i - 1]).
                    css({ borderRadius: h, backgroundColor: r.color });
            }

            row.append(td);
        },

        setDefault: function(dontDraw) {
            this.rings = this.initRings.clone();
        },

        pushRing: function(ring, sourceIndex) {
            if (this.rings.length > 0) {
                let top = this.rings[this.rings.length - 1];
                if (top.width < ring.width)
                    throw new IncorrectInput(
                        'Кольцо на пирамидке "' + (sourceIndex + 1) +
                        '" больше,\nчем кольцо на пирамидке "' + (this.index + 1) + '"');
                if (top.color != ring.color)
                    throw new IncorrectInput('Цвета колец различны!');
            }
            this.rings.push(ring);
            $('#' + _row_id(this.index)).find('td').eq(this.index % COL_COUNT).find('p.pole').eq(MAX_RINGS - this.rings.length).
                append($('#' + _row_id(sourceIndex)).find('td').eq(sourceIndex % COL_COUNT).find('div').eq(0));
        },

        checkHasRing: function() {
            if (this.rings.length == 0)
                throw new IncorrectInput('На пирамидке "' + (this.index + 1) + '" нет колец');
            return this;
        },

        popRing: function() {
            return this.checkHasRing().rings.pop();
        },
    });

    function move(x, y) {
        curProblem.oneStep('move', undefined, [x, y]);
    }

    function compareRings(args) {
        if (args.length != 4) {
            throw new IncorrectInput('Некорректный список аргументов');
        }
        var comparator = args[2];
        var result = curProblem.executionUnit.getExecutionUnit().compare(args[1], args[3], comparator);
        return result != (args[0] == 'not');
        }

    function compareRingsHandler(first, comparator, second) {
        return curProblem.executionUnit.getExecutionUnit().compare(first, second, comparator.v)
    }

    var MessageWon = $.inherit(Message, {
        __constructor: function(step, points) {
            this.__base(['Шаг ', step + 1, ': Вы выполнили задание!\nКоличество очков: ', points, '\n' ]);
        }
    });

    return {
        Hanoi: $.inherit({
            __constructor: function(problem, problemData, div) {
                this.data = {};
                $.extend(true, this.data, problemData.data);
                this.div = div;
                $(this.div).empty();
                this.problem = problem;
                this.constructCommands();
                this.pyramids = [];
                this.init();
            },

            constructCommands: function() {
                this.commands = {};

                let argP = [
                    new ExecutionUnitCommands.CommandArgumentSpin(1, this.data.pyramids.length),
                    new ExecutionUnitCommands.CommandArgumentSpin(1, this.data.pyramids.length)
                ];

                this.commands.move = new ExecutionUnitCommands.ExecutionUnitCommand('move', move, argP);

                let pyramidsList = [];
                for (let i = 0; i < this.data.pyramids.length; ++i)
                    pyramidsList.push([ i + 1, i + 1 ]);
                let comparisons = [ '<', '>', '<=', '>=', '==', '!=' ].map(c => [c, c]);

                this.testFunction = [
                    {
                        name: 'compareRings',
                        title: 'Cравнение:',
                        args: [
                            new ExecutionUnitCommands.CommandArgumentSelect(pyramidsList),
                            new ExecutionUnitCommands.CommandArgumentSelect(comparisons),
                            new ExecutionUnitCommands.CommandArgumentSelect(pyramidsList),
                        ]  ,
                        jsFunc: compareRings,
                        handlerFunc: compareRingsHandler,
                    }
                ];
            },

            init: function() {
                let table = $('<table id="TableHanoi"></table>').appendTo(this.div);
                let row;
                for (var i = 0; i < this.data.pyramids.length; ++i) {
                    if (i % COL_COUNT == 0)
                        row = $('<tr id="' + _row_id(i) + '"></tr>').appendTo(table)
                    this.pyramids.push(new Pyramid(this.data.pyramids[i].rings, i, row, this.data.pyramids[i].color));
                }

                this.points = this.data.startPoints;
            },

            getAllowedCommands: function() { return this.data.commands; },

            getCommandNames: function() { return this.__self.cmdClassToName; },

            getCommandName: function(command) { return this.__self.cmdClassToName[command]; },

            setDefault: function(dontDraw) {
                for (var i = 0; i < this.pyramids.length; ++i) {
                    this.pyramids[i].setDefault();
                }
                $('#TableHanoi').remove();
                this.init();

                this.points = this.data.startPoints;
            },

            executeCommand: function(command, args) {
                if (!this.isCommandSupported(command))
                    throw new IncorrectInput('Команда ' + command + ' не поддерживается');

                switch (command) {
                    case 'move':
                        this.move(args);
                        break;
                    default:
                        throw new IncorrectInput('Команда ' + command + ' не поддерживается');
                }

                if (this.data.stepsFine){
                    this.points -= this.data.stepsFine;
                    var mes = new ShowMessages.MessageStepFine(this.problem.step, this.points);
                }
            },

            executionFinished: function(){
                if (this.isSolved()) {
                    this.points += this.data.pointsWon;
                    var mes = new MessageWon(this.problem.step, this.points);
                }
            },

            checkPyramidNumber: function (arg) {
                if (!checkNumber(arg))
                    throw new IncorrectInput('Некорректный номер пирамидки "' + arg + '"');
                if (!this.pyramids[arg - 1])
                    throw new IncorrectInput('Нет пирамидки с номером "' + arg + '"');
            },

            move: function(args) {
                this.checkPyramidNumber(args[0]);
                this.checkPyramidNumber(args[1]);
                var src = args[0] - 1;
                var dst = args[1] - 1;

                if (src == dst) throw new IncorrectInput('Нельзя переместить на ту же самую пирамидку');

                let ring = this.pyramids[src].popRing();
                this.pyramids[dst].pushRing(ring, src);
            },

            isSolved: function() {
                for (var i = 0; i < this.data.finishState.length; ++i) {
                    var state = this.data.finishState[i];
                    var pyramid = this.pyramids[state.pyramid - 1];
                    if (pyramid.rings.length != state.rings) return false;
                    for (let j = 0; j < pyramid.rings.length; ++j)
                        if (pyramid.rings[j].color != state.color)
                            return false;
                }
                return true;
            },

            draw: function() {
                /* for (var i = 0; i < this.pyramids.length; ++i) {
                    this.pyramids[i].draw();
                } */
            },

            compare: function (first, second, comparator) {
                this.checkPyramidNumber(first);
                this.checkPyramidNumber(second);
                let p1 = this.pyramids[first - 1].checkHasRing();
                let p2 = this.pyramids[second - 1].checkHasRing();
                let a = p1.rings[p1.rings.length - 1].width;
                let b = p2.rings[p2.rings.length - 1].width;
                switch (comparator) {
                    case '<': return a < b;
                    case '>': return a > b;
                    case '<=': return a <= b;
                    case '>=': return a >= b;
                    case '==': return a == b;
                    case '!=': return a != b;
                    default: throw new IncorrectInput('Неизвестная операция сравнения "' + comparator + '"');
                }
            },

            isGameOver: function() { return this.dead;},

            gameOver: function() { this.dead = true; },

            getPoints: function() { return this.points; },

            isCommandSupported: function(command) {
                return this.data.commands.indexOf(command) !== -1
            },

            getConditionProperties: function(name) { return this.testFunction; },

            getCommands: function() { return this.commands; },

            getCssFileName: function() { return this.__self.cssFileName; },

            onTabSelect: function() {}
        },

        {
            cmdClassToName: {
                'move': 'Переместить'
            },

            cssFileName: "styles/hanoi.css",

            jsTreeTypes: [
                ['move', 'images/hanoi_move.png']
            ]
        })
    };

});
