define('Hanoi', ['jQuery', 'jQueryUI', 'jQueryInherit', 'ExecutionUnitCommands', 'ShowMessages', 'Declaration', 'Exceptions'], function(){
    var ShowMessages = require('ShowMessages');
    var ExecutionUnitCommands = require('ExecutionUnitCommands');
    var Exceptions = require('Exceptions');
    var IncorrectInput = Exceptions.IncorrectInput;
    var InternalError = Exceptions.InternalError;

    var Message = ShowMessages.Message;

    var Pyramid = $.inherit({

        __constructor: function(rings, index, div, num_lines, color, size){
            this.rings = rings;
            this.initRings = rings;
            this.div = div;
            this.index = index;
            this.color = color;
            this.size = size;

            this.init(num_lines);
        },

        init: function(num_lines) {

            num_lines--;

            let num_ring = 0;

            let td = $('<td class="base" align="center" style = "width:33%; height:100%"></td>');

            for (let j = 0; j < 8; j++) td.append('<p style = "height:25px; width:100%; margin:0"></p>');

            td.find("p").eq(0).append('<h3>' + String(this.index + 1) + '</h3>');

            for (let i = 5; i > (5 - this.rings); i--){
                td.find("p").eq(i).append(
                    '<div style="height:80%; width:' +  String(this.size[num_ring].width) + '%; background-color:' + this.color +
                    '; border:'+ this.color + ' solid 0.1px; border-radius:75px"</div>');
                num_ring++;

            };

            $('#FieldPyr' + String(num_lines)).append(td);


        },

        setDefault: function(dontDraw) {
                this.rings = this.initRings;
        },

        draw: function(x) {
            let sup_x = x;
            let sup_y = this.index;
            if (x % 3 == 2) sup_x = x - 1;
            if (this.index % 3 == 2) sup_y = this.index - 1;


            let sup_str1 = $('#FieldPyr' + String(Math.floor((sup_x + 1) / 3))).find("td").eq(x - (3 * Math.floor((sup_x + 1) / 3))).find("div").eq(0).css('width');
            let sup_str2 = $('#FieldPyr' + String(Math.floor((sup_y + 1) / 3))).find("td").eq(this.index - (3 * Math.floor((sup_y + 1) / 3))).find("div").eq(0).css('width');

            let sup_bool = false;

            if (String(sup_str1).length < String(sup_str2).length) sup_bool = true;
            else if ((sup_str1 <= sup_str2) && (String(sup_str1).length == String(sup_str2).length)) sup_bool = true;

            if (sup_bool){

                $('#FieldPyr' + String(Math.floor((sup_y + 1) / 3))).find("td").
                    eq(this.index - (3 * Math.floor((sup_y + 1) / 3))).find("p").eq(6 - this.rings).
                    append($('#FieldPyr' + String(Math.floor((sup_x + 1) / 3))).find("td").eq(x - (3 * Math.floor((sup_x + 1) / 3))).find("div").eq(0));

            }
            else
                throw new IncorrectInput('Кольцо на ' + String(x + 1) + ' пирамидке больше,\nчем кольцо на ' + String(this.index + 1) + ' пирамидке');

        },



        moveTo: function(delta) {
            this.rings--;
        },

        moveFrom: function(delta) {
            this.rings++;
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

                let num_lines = Math.ceil(this.data.pyramids.length / 3);

                /* this.div.parent().parent().css({"position":"relative",
                              "width":"100%",
                              "height":"100%"});     */
                let table = $('<table id = "TableShift" style = "height: 170px; width: 100%"></table>').appendTo(this.div);
                for (let i = 0; i < num_lines;i++) $('<tr id="FieldPyr' + String(i) + '" style = "height: 170px; width = 100%"></tr>').appendTo(table);

                for (var i = 0; i < this.data.pyramids.length; ++i)
                    this.pyramids.push(new Pyramid(this.data.pyramids[i].rings.length, i, this.div, Math.ceil((i + 1)/3), this.data.pyramids[i].color, this.data.pyramids[i].rings));

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
                if (this.isSolved() == this.data.finishState.length) {
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

                let sup_x = x;
                let sup_y = y;

                if (x % 3 == 2) sup_x = x - 1;
                if (y % 3 == 2) sup_y = y - 1;

                if ((!($('#FieldPyr' + String(Math.floor((sup_x + 1) / 3))).find("td").eq(x - (3 * Math.floor((sup_x + 1) / 3))).find("div").length))) {
                    throw new IncorrectInput('На пирамидке "' + args[0] + '" нет колец');
                }

                if (($('#FieldPyr' + String(Math.floor((sup_x + 1) / 3))).find("td").eq(x - (3 * Math.floor((sup_x + 1) / 3))).
                    find("div").length > 0) && ($('#FieldPyr' + String(Math.floor((sup_y + 1) / 3))).find("td").eq(y - (3 * Math.floor((sup_y + 1) / 3))).find("div").length > 0)
                ) {
                    if ($('#FieldPyr' + String(Math.floor((sup_x + 1) / 3))).find("td").eq(x - (3 * Math.floor((sup_x + 1) / 3))).find("div").eq(0).css('background-color') !=
                        $('#FieldPyr' + String(Math.floor((sup_y + 1) / 3))).find("td").eq(y - (3 * Math.floor((sup_y + 1) / 3))).find("div").eq(0).css('background-color')
                    ) {
                        throw new IncorrectInput('Цвета колец различны!');
                    }
                }

                if (x == y) throw new IncorrectInput('Некорректный аргумент');

                this.pyramids[x].moveTo();
                this.pyramids[y].moveFrom();
                this.pyramids[y].draw(x);
            },

            isSolved: function() {
                let result = 2;
                for (var i = 0; i < this.data.finishState.length; ++i) {

                    var pyramid = this.data.finishState[i].pyramid;
                    let sup_pyr = pyramid;
                    if (pyramid % 3 == 2) sup_pyr = pyramid - 1;

                    if ((this.pyramids[pyramid].rings != this.data.finishState[i].rings) ||
                        ($('#FieldPyr' + String(Math.floor((sup_pyr + 1) / 3))).find("td").eq(pyramid - (3 * Math.floor((sup_pyr + 1) / 3))).
                        find("div").eq(0).css('background-color') != this.data.finishState[i].color)
                    ) {
                        result--;
                    }

                }
                //console.log(String(result));
                return result;
            },

            draw: function() {
                /* for (var i = 0; i < this.pyramids.length; ++i) {
                    this.pyramids[i].draw();
                } */
            },

            isLessPyramid: function(first,second) {

                first--;
                second--;
                let sup_first = first;
                let sup_second = second;
                if (first % 3 == 2) sup_first = first - 1;
                if (second % 3 == 2) sup_second = second - 1;

                let sup_str1 = $('#FieldPyr' + String(Math.floor((sup_first+1) / 3))).find("td").eq(first - (3 * Math.floor((sup_first+1) / 3))).find("div").eq(0).css('width');
                let sup_str2 = $('#FieldPyr' + String(Math.floor((sup_second+1) / 3))).find("td").eq(second - (3 * Math.floor((sup_second+1) / 3))).find("div").eq(0).css('width');
                let result = false;

                if ((!($('#FieldPyr' + String(Math.floor((sup_first+1) / 3))).find("td").eq(first - (3 * Math.floor((sup_first+1) / 3))).find("div").length)) ||
                    (!($('#FieldPyr' + String(Math.floor((sup_second+1) / 3))).find("td").eq(second - (3 * Math.floor((sup_second+1) / 3))).find("div").length)))
                    return false;

                if (String(sup_str1).length < String(sup_str2).length) result = true;
                else if ((sup_str1 < sup_str2) && (String(sup_str1).length == String(sup_str2).length)) result = true;

                return  result;
            },

            isGreaterPyramid: function(first,second) {
                first--;
                second--;
                let sup_first = first;
                let sup_second = second;
                if (first % 3 == 2) sup_first = first - 1;
                if (second % 3 == 2) sup_second = second - 1;

                let sup_str1 = $('#FieldPyr' + String(Math.floor((sup_first+1) / 3))).find("td").eq(first - (3 * Math.floor((sup_first+1) / 3))).find("div").eq(0).css('width');
                let sup_str2 = $('#FieldPyr' + String(Math.floor((sup_second+1) / 3))).find("td").eq(second - (3 * Math.floor((sup_second+1) / 3))).find("div").eq(0).css('width');
                let result = false;

                if ((!(String(sup_str1).length)) || (!(String(sup_str2).length))) return false;

                if (String(sup_str1).length > String(sup_str2).length) result = true;
                else if ((sup_str1 > sup_str2) && (String(sup_str1).length == String(sup_str2).length)) result = true;

                return  result;
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
