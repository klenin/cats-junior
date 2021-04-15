define('Hanoi', ['jQuery', 'jQueryUI', 'jQueryInherit', 'ExecutionUnitCommands', 'ShowMessages', 'Declaration', 'Exceptions'], function(){
    var ShowMessages = require('ShowMessages');
    var ExecutionUnitCommands = require('ExecutionUnitCommands');
    var Exceptions = require('Exceptions');
    var IncorrectInput = Exceptions.IncorrectInput;
    var InternalError = Exceptions.InternalError;

    var Message = ShowMessages.Message;

    var Pyramid = $.inherit({

        __constructor: function(rings, index, div, row, color){
            this.rings = rings;
            this.initRings = rings.clone();
            this.div = div;
            this.index = index;

            this.init(row);
        },

        init: function(row) {
            let td = $('<td class="base" align="center" style = "width:33%; height:100%"></td>');

            for (let j = 0; j < 8; j++) td.append('<p style = "height:25px; width:100%; margin:0"></p>');

            td.find("p").eq(0).append('<h3>' + (this.index + 1) + '</h3>');

            for (let i = 0; i < this.rings.length; i++){
                let r = this.rings[i];
                if (!r.color) r.color = color;
                td.find("p").eq(5 - i).append(
                    '<div style="height:80%; width:' +  r.width + '%; background-color:' + r.color +
                    '; border:'+ r.color + ' solid 0.1px; border-radius:75px"></div>');
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
                    throw new IncorrectInput('Кольцо на пирамидке ' + (sourceIndex + 1) + ' больше,\nчем кольцо на пирамидке ' + (this.index + 1));
                if (top.color != ring.color)
                    throw new IncorrectInput('Цвета колец различны!');
            }
            this.rings.push(ring);

            let row = $('#FieldPyr' + Math.floor(this.index / 3));
            let sourceRow = $('#FieldPyr' + Math.floor(sourceIndex / 3));
            row.find('td').eq(this.index % 3).find('p').eq(6 - this.rings.length).
                append(sourceRow.find('td').eq(sourceIndex % 3).find('div').eq(0));
        },

        popRing: function() {
            if (this.rings.length == 0)
                throw new IncorrectInput('На пирамидке "' + (this.index + 1) + '" нет колец');
            return this.rings.pop();
        },
    });

    function move(x, y) {
        curProblem.oneStep('move', undefined, [x, y]);
    }

    function compareRings(args){

        if (args.length != 4 || !checkNumber(args[1]) || !checkNumber(args[3])) {
            throw new IncorrectInput('Некорректный список аргументов');
        }

        var comparator = args[2];
        var result = false;

        switch(comparator) {
            case '<':
                result = curProblem.executionUnit.getExecutionUnit().isLessPyramid(args[1], args[3]);
                break;
            case '>':
                result = curProblem.executionUnit.getExecutionUnit().isGreaterPyramid(args[1], args[3]);
                break;
            }

            if (args[0] == 'not')
                result = !result;

            return result;
        }

    function compareRingsHandler(first, comparator, second){

        if (!checkNumber(first) || !checkNumber(second)) {
            throw new IncorrectInput('Некорректный аргумент');
        }

        comparator = comparator.v;

        switch(comparator) {
            case '<':
                return curProblem.executionUnit.getExecutionUnit().isLessPyramid(first, second);
            case '>':
                return curProblem.executionUnit.getExecutionUnit().isGreaterPyramid(first, second);
        }

        return false;
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

                this.commands['move'] = new ExecutionUnitCommands.ExecutionUnitCommand('move', move, argP);

                var pyramidsList = [];
                for (var i = 0; i < this.data.pyramids.length; ++i) {
                    pyramidsList.push([i + 1, i + 1]);
                }

                this.testFunction = [
                {
                    'name': 'compareRings',
                    'title': 'Cравнение:',
                    'args': [
                        new ExecutionUnitCommands.CommandArgumentSelect(pyramidsList),
                        new ExecutionUnitCommands.CommandArgumentSelect([['<', '<'], ['>', '>']]),
                        new ExecutionUnitCommands.CommandArgumentSelect(pyramidsList),
                    ]  ,
                    'jsFunc': compareRings,
                    'handlerFunc': compareRingsHandler,
                }]
            },

            init: function() {
                let table = $('<table id="TableShift" style="height: 170px; width: 100%"></table>').appendTo(this.div);
                let row;
                for (var i = 0; i < this.data.pyramids.length; ++i) {
                    if (i % 3 == 0)
                        row = $('<tr id="FieldPyr' + (i / 3) + '" style = "height: 170px; width: 100%;"></tr>').appendTo(table)
                    this.pyramids.push(new Pyramid(this.data.pyramids[i].rings, i, this.div, row, this.data.pyramids[i].color));
                }

                this.points = this.data.startPoints;
            },

            getAllowedCommands: function() {
                return this.data.commands;
            },

            getCommandNames: function() {
                return this.__self.cmdClassToName;
            },

            getCommandName: function(command) {
                return this.__self.cmdClassToName[command];
            },

            setDefault: function(dontDraw) {

                for (var i = 0; i < this.pyramids.length; ++i) {
                    this.pyramids[i].setDefault();
                };
                $('#TableShift').remove();
                this.init();

                this.points = this.data.startPoints;
            },

            executeCommand: function(command, args) {
                if (this.data.commands.indexOf(command) === -1) {
                    throw new IncorrectInput('Команда ' + command + ' не поддерживается');
                }

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

            move: function(args) {
                var x = args[0] - 1;
                var y = args[1] - 1;
                if (!checkNumber(x) || !checkNumber(y)) {
                    throw new IncorrectInput('Некорректный аргумент');
                }
                if (!this.pyramids[x]) {
                    throw new IncorrectInput('Нет пирамидки с номером "' + args[0] + '"');
                }
                if (!this.pyramids[y]) {
                    throw new IncorrectInput('Нет пирамидки с номером "' + args[1] + '"');
                }

                if (x == y) throw new IncorrectInput('Некорректный аргумент');

                let ring = this.pyramids[x].popRing();
                this.pyramids[y].pushRing(ring, x);
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

            isLessPyramid: function(first, second) {
                return this.pyramids[first - 1].rings.length < this.pyramids[second - 1].rings.length;
            },

            isGreaterPyramid: function(first,second) {
                return this.pyramids[first - 1].rings.length > this.pyramids[second - 1].rings.length;
            },

            isGameOver: function() {
                return this.dead;
            },

            gameOver: function() {
                this.dead = true;
            },

            getPoints: function() {
                return this.points;
            },

            isCommandSupported: function(command) {
                return this.data.commands.indexOf(command) !== -1
            },

            getConditionProperties: function(name) {
                return this.testFunction;
            },

            getCommands: function() {
                return this.commands;
            },

            getCssFileName: function() {
                return this.__self.cssFileName;
            },

            onTabSelect: function() {
                return;
            }
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
