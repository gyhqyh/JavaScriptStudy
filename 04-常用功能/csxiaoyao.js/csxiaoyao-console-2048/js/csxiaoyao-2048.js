
var gmFactory = function(size){

    var moves;
    var tiles, max = moves = 0, winScores = 2048, actions = [], histories = [];

    var events = {'start':[] ,'end':[] ,'move':[] };

    var instance;
    instance = {
        init: function (initRow, maxScores) {

            tiles = new Array(initRow * initRow);
            size = initRow;
            for (var i = 0; i < tiles.length; i++) {
                tiles[i] = 0;
            }

            if (maxScores) winScores = maxScores;

            Object.defineProperty(this, "tiles", {
                get: function () {
                    return tiles;
                }
            });

            Object.defineProperty(this, "actions", {
                get: function () {
                    return actions;
                }
            });

            Object.defineProperty(this, "highestScore", {
                get: function () {
                    return max;
                }
            });

            Object.defineProperty(this, "moves", {
                get: function () {
                    return moves;
                }
            });

            Object.defineProperty(this, 'maxScores', {
                get: function () {
                    return winScores;
                }
            });

            for (i = 0; i < 6; i++) {
                this.randomVal();
            }
        }
        , randomVal: function () {
            var emptyTiles = [];
            for (var i = 0; i < tiles.length; i++) {
                if (tiles[i] == 0) emptyTiles.push(i);
            }

            if (emptyTiles.length < 1) {
                return false;
            }

            var pos = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            tiles[pos] = Math.random() < 0.8 ? 2 : 4;

            actions.push({'type': 'create', 'index': pos, 'value': tiles[pos]});
        }, move: function (dir) {
            var rowStart, rowStep, nextStep;
            actions = [];
            if (dir === 'up') {
                rowStart = 0;
                rowStep = 1;
                nextStep = size;
            } else if (dir === 'left') {
                rowStart = 0;
                rowStep = size;
                nextStep = 1;
            } else if (dir === 'down') {
                rowStart = tiles.length - 1;
                rowStep = -1;
                nextStep = -size;
            } else if (dir === 'right') {
                rowStart = tiles.length - 1;
                rowStep = -size;
                nextStep = -1;
            }
            moves++;
            var end = tiles.length - 1 - rowStart;
            var megnet = rowStart;

            var his = [];
            for (var i = 0; i < tiles.length; i++) {
                his[i] = tiles[i];
            }
            histories.push(his);

            var currentRow = 0;
            while ((end != 0 && megnet < end) || (end == 0 && megnet > 0) && currentRow < size) {

                var floatTile = megnet;
                while (!this.isAtEdge(dir, megnet)) {

                    floatTile = floatTile + nextStep;
                    var floatTileValue = tiles[floatTile];
                    var megnetTileValue = tiles[megnet];

                    var swallowed = this.swallowUp(floatTile, megnet);
                    if (swallowed || (!swallowed && floatTileValue != 0 && megnetTileValue != 0)) {
                        megnet = megnet + nextStep;
                        floatTile = megnet;
                        continue;
                    }
                    if (this.isAtEdge(dir, floatTile)) {
                        megnet = floatTile;
                        break;
                    }
                }

                rowStart += rowStep;
                currentRow++;
                megnet = rowStart;
            }
            this.randomVal();
        }
        , isAtEdge: function (dir, tileIndex) {
            var leftMargin = 0, rightMargin = size - 1;
            var maxTopRowValue = size - 1, minBottomRowValue = tiles.length - size;
            switch (dir) {
                case 'down':
                    return tileIndex <= maxTopRowValue;
                case 'up':
                    return tileIndex >= minBottomRowValue;
                case 'left':
                    return tileIndex % size == rightMargin;
                case 'right':
                    return tileIndex % size == leftMargin;
            }
        }
        , swallowUp: function (floatTile, megnet) {
            var v1 = tiles[floatTile], v2 = tiles[megnet];

            if (v1 == 0) return false;

            if (v1 == v2 || v2 == 0) {
                var v = v1 + v2;
                tiles[megnet] = v;
                tiles[floatTile] = 0;

                actions.push({
                    'type': 'move', 'from': {'index': floatTile, 'value': v1}, 'to': {'index': megnet, 'value': v}
                });

                max = Math.max(max, v);
                if (max == winScores) {
                    this.init(size);
                    this.fireEvent("end", this);
                }

                return v2 != 0;
            }

            return false;
        }, back: function () {
            if (histories.length < 1) return;
            tiles = histories.pop();
            this.render();
        }, setRenderer: function (renderer) {
            this.renderer = renderer;
            renderer.init(this);
        }, render: function () {
            this.renderer.render(this.tiles, actions);
        }, on: function (eventName, handler, scope) {
            if (!events[eventName]) return;
            var handlers = events[eventName];
            handlers.push({'fn': handler, 'scope': scope});
        }, un: function (eventName, handler, scope) {
            if (!events[eventName]) return;
            var handlers = events[eventName];
            if (handlers.length < 1) return;

            for (var i = 0; i < handlers.length; i++) {
                var h = handlers[i];
                if (h.fn == handler && h.scope == scope) {
                    handlers.splice(i, 1);
                    break;
                }
            }
        }
        , fireEvent: function () {
            var eventName = arguments[0];
            var args = arguments.slice(1);
            var handlers = events[eventName];
            if (!handlers || handlers.length < 1) return;
            for (var i = 0; i < handlers.length; i++) {
                var h = handlers[i];
                if (typeof h.fn == 'function') {
                    h.fn.apply(h.scope, args);
                }
            }
        }
    };

    instance.init(size);

    return instance;

};

var consoleRender = function(){
};

consoleRender.prototype.game = null;

consoleRender.prototype.colorPalette = function(keys){
    var colors = ['#eee4da','#ede0c8','#f2b179','#f59563','#f67c5f','#f65e3b','#edcf72','#edcc61','#edc850','#edc53f','#edc22e'];
    var r = {};
    var keys = keys.split(",");
    var length = keys.length;
    for(var i=0;i<length;i++){
        r[keys[i]] = ';background-color:'+colors[i]+';';
    }
    return r;
};

consoleRender.prototype.pad = function(str,length){
    str=(str||' ')+'';
    while(length>str.length) str=' '+str+' ';
    if(str.length>length) str = str.slice(0,length-str.length);
    return str;
};

consoleRender.prototype.render = function(tiles,actions, notClear){
    if(!notClear) console.clear();
    // console.log(' ');
    var size = Math.sqrt(tiles.length);
    var colors = this.colorPalette("2,4,8,16,32,64,128,256,512,1024,2048");
    var baseStyle='text-align:center;width:100px;display:block;background-color:#ccc;padding:4px 7px;line-height:1.4;color:#000;';
    
    console.log("%c", "padding:18px 300px;line-height:60px;background:url('http://www.csxiaoyao.com/src/img/sunshine274x48.png') no-repeat;");
    console.log("%cDesign By CS逍遥剑仙 (www.csxiaoyao.com)","line-height:40px;font-weight: 600;font-family: 微软雅黑,'Microsoft YaHei';-webkit-background-clip: text;font-size: 1.2em;text-shadow: 0 1px 0 #ccc,0 2px 0 #c9c9c9,0 3px 0 #bbb,0 4px 0 #b9b9b9,0 5px 0 #aaa,0 6px 1px rgba(0,0,0,.1),0 0 5px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.3),0 3px 5px rgba(0,0,0,.2),0 5px 10px rgba(0,0,0,.25),0 10px 10px rgba(0,0,0,.2),0 20px 20px rgba(0,0,0,.15);");

    console.log('为了感谢你访问 %cSUNSHINE STUDIO%c，我准备了一个小游戏','font-weight: 600;font-family: 微软雅黑,"Microsoft YaHei";background-image: -webkit-gradient(linear, left top, right top, color-stop(0, #f22), color-stop(0.22, #f22), color-stop(0.23, #22f), color-stop(0.58, #22f), color-stop(0.59, #ff2), color-stop(1, #e33cff));color: transparent;-webkit-background-clip: text;','');
    
    var args = [
        '请在%c非console%c的主窗口中按 %c回车%c 开始游戏，使用 %c方向键%c 或 %cWASD%c 控制方向，争取2048吧！'
        ,'color:red;font-weight:bold;',''
        ,'color:red;font-weight:bold;',''
        ,'color:red;font-weight:bold;',''
        ,'color:red;font-weight:bold;',''
    ];
    console.log.apply(console,args);

    console.log('(请确保所有按键操作是在非console的主窗口中)');
    console.log(' ');

    for(var i=0;i<size;i+=1){
        var msg = [];
        var style = [];
        for(var j=0;j<size;j++){
            var v = tiles[size*i+j];
            msg.push('%c'+this.pad(v,4)+'%c');
            style.push(baseStyle+';font-size:14px;'+(colors[v]||''));
            // msg.push('%c'+(v ? this.pad(v,4) : this.pad(i*size+j,4))+'%c');
            // style.push(baseStyle+';font-size:14px;'+(colors[v]||'color:#999;opacity:0.5'))
            style.push('');
        }
        msg.push('%c'+Math.random()); // avoid console combine same rows
        style.push('padding-left:50px;dispaly:none;color:white;line-height:1.3');
        console.log.apply(console, [msg.join('')].concat(style));
    }
    console.log("%c", "padding:90px 200px;line-height:220px;background:url('http://www.csxiaoyao.com/src/img/wxplat200.jpg') no-repeat;");
    var msg = [];
    for(var i=0;i<actions.length;i++){
        var a = actions[i];
        if(a.type=='move'){
            msg.push('#'+a.from.index+'->#'+a.to.index);
        }else{
            msg.push(a.value+' created at #'+a.index)
        }
    }
    // console.log('actions: '+ msg.join(' , ')+' , '+ 'highestScore:'+this.game.highestScore);
};

consoleRender.prototype.keydownHandler = function(e){
    var keynum, keychar;
    keynum = e.keyCode || e.which;
    if(!this.started){
        if(keynum==13){
            this.started = true;
            this.game.render();
        }
        return;
    }

    //32 = space, 13 = enter
    var map = {
        87:'up' //'w'
        ,83:'down' //'s'
        ,65:'left' //'a'
        ,68:'right' //'d'
        ,37:'left'
        ,38:'up'
        ,39:'right'
        ,40:'down'

        ,90:'z'
    };
    if(!map[keynum]) return;

    if(map[keynum]=='z'){
        return this.game.back();
    }

    this.game.move(map[keynum]);
    this.game.render();     
};

consoleRender.prototype.init = function(game){
    
    this.game = game;

    if(typeof $=='function'){
        $(window).on("keydown",$.proxy(this.keydownHandler,this));
    }else{
        window.addEventListener = this.keydownHandler.bind(this);
    }

};

!function(global){
    
    if(!console) return;

    var gm2048 = new gmFactory(4);
    var chromerenderer = new consoleRender();
    gm2048.setRenderer(chromerenderer);

    chromerenderer.render(gm2048.tiles,gm2048.actions,true);
}(this);