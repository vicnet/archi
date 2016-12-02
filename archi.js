'use strict';

$(window).on('load', function () {

    function Model() {
        this.active = null;
        
        this.draft = [];
        for (var i = 1; i <= 18; ++i) {
            // remove special cards
            if (i==1) continue;
            if (i==11) continue;
            // add other cards
            this.draft.push(i);
        }
        shuffle(this.draft);

        this.drawCard = function() {
            this.active = this.draft.pop();
            return this.active;
        }
    };
    var model = new Model();

    function toPlantum(states) {
        function toName(value) {
            if (value.name) return value.name;
             return value;
        }
        var uml = '';
        uml += '@startuml\n';
        var first = true;
        for (var state of states) {
            if (first) {
                first = false;
                uml += '[*] --> '+state.name+'\n';
            }
            if (state.entry) {
                uml += state.name+' : entry:'+toName(state.entry)+'()\n';
            }
            if (state.exit) {
                uml += state.name+' : exit:'+toName(state.exit)+'()\n';
            }
            for (var transition of state.transitions) {
                var evt = '';
                if (transition.guard) {
                    evt += '['+transition.guard+'] ';
                }
                evt += transition.trigger;
                if (transition.action) {
                    evt += ' / '+toName(transition.action+'()');
                }
                uml += state.name+' --> '+transition.dest+' : '+evt+'\n';
            }
        }
        uml += '@enduml\n';
        alert(uml);
    }
    
    var app = {
        states: [{
            name: 'INIT',
            transitions: [{
                trigger: 'click.closed',
                guard: 'isClosedCards',
                dest: 'DRAW'
            }, {
                trigger: 'click.open',
                guard: 'isOpenCards',
                dest: 'TAKE'
            }]
        }, {
            name: 'GAME',
            entry: 'repositionCard',
            transitions: [{
                trigger: 'click.closed',
                guard: 'isClosedCards',
                action: 'playCard',
                dest: 'DRAW'
            }, {
                trigger: 'click.open',
                guard: 'isOpenCards',
                action: 'playCard',
                dest: 'TAKE'
            }, {
                trigger: 'click.active',
                action: 'rotateCard',
                dest: 'GAME'
            }, {
                trigger: 'drop',
                dest: 'GAME'
            }]
        }, {
            name: 'DRAW',
            entry: function auto() {
                app.handleStateTrigger('auto'); // auto trigger
            },
            exit: 'drawCard',
            transitions: [{
                trigger: 'auto',
                dest: 'GAME'
            }]
        }, {
            name: 'TAKE',
            entry: function auto() {
                app.handleStateTrigger('auto'); // auto trigger
            },
            exit: 'takeCard',
            transitions: [{
                trigger: 'auto',
                dest: 'GAME'
            }]
        }],

        repositionCard: function() {
            var $card = this.active;
            console.log('Reposition card', $card[0].id,'rotate', $card[0].rotation);
            var grid;
            var pos = $card.position();
/*
            if ((card.rotation!=0) || (card.rotation!=180)) {
                grid = card.width()/2;
            } else {
                grid = card.height()/2;
            }
*/
            if (($card[0].rotation===90) || ($card[0].rotation===270)) {
                grid = $card.height()/2;
            } else {
                grid = $card.width()/2;
            }
            var x = Math.round(pos.left/grid)*grid;
            x = Math.max(x,0);
            var y = Math.round(pos.top/grid)*grid;
            y = Math.max(y,0);
            console.log('Reposition active from', pos, 'to', x,y);
            $card[0].style.left = x + "px";
            $card[0].style.top = y + "px";
        },
        activateCard: function($card) {
            // add on active
            $('#active').append($card);
            $card.draggable();
            this.active = $card;
            console.log('Active',this.active[0]);
            this.played = null;
        },
        drawCard: function() {
            console.log('Draw a closed card, put in game');
            // remove from draft
            this.played.remove();
            // get new one
            var card = model.drawCard();
            // create new card
            var src = 'src="cards/' + card + '.png" ';
            var id = 'id="' + card + '" ';
            var $card = $('<img class="card"' + id + src + '></img>');
            // add on active
            this.activateCard($card);
        },
        takeCard: function() {
            console.log('Take an open card, put in game');
            // remove from draft
            this.played.remove();
            // add on active
            this.activateCard(this.played);
        },
        rotateCard: function() {
            var $card = this.active;
            var card = $card[0];
            console.log('Rotate active card', card.id);
            if (!card.rotation) card.rotation = 0;
            card.rotation += 90; card.rotation %= 360;
            // apply rotation style
            $card.removeClass('rotate0 rotate90 rotate180 rotate270');
            $card.addClass('rotate'+card.rotation);
        },
        isClosedCards: function() {
            //console.log('Closed number');
            return $('#closed').children().length>1; // 1 for back
        },
        isOpenCards: function() {
            //console.log('Closed number');
            return $('#open').children().length>0;
        },
        playCard: function() {
            var $card = this.active;
            console.log('Play active card', $card[0].id);
            // remove from active
            $card.draggable('destroy');
            $card.remove();
            // add on game
            $('#board').append($card);
            this.active = null;
        }
    };
    
    StateMachine.init(app);
    
    $(".hand").on("click", ".card", function () {
        var $card = $(this);
        if ($card.parents(".active-hand").length<=0) return;
        var hand = $card.parent()[0].id;
        var card = $card[0].id;
        console.log('Click on ',card,'in',hand);
        app.played = $card;
        app.handleStateTrigger('click.'+hand)
    });
    
    $("#active").droppable({
        drop: function(event, ui) {
            console.log("Drop on", ui.draggable, "at", ui.position);
            app.handleStateTrigger('drop');
        }
    });
//    toPlantum(app.states);
});
