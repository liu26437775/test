//=====================================================
//=====================================================
//常用工具封装类
//=====================================================
//=====================================================

(function (win) {
    String.prototype.getStringLength = function () {
        var str = this;
        var l = str.length;
        var blen = 0;
        for (var i = 0; i < l; i++) {
            if ((str.charCodeAt(i) & 0xff00) != 0) {
                blen++;
            }
            blen++;
        }
        return blen;
    };
    Number.prototype.toDecimal2 = function () {
        var x = this;
        var f = parseFloat(x);
        if (isNaN(f)) {
            return;
        }
        f = Math.round(x * 100) / 100;
        return f;
    };
    function getBrowserInfo() {
        var Sys = {};
        var ua = navigator.userAgent.toLowerCase();
        var re = /(msie|firefox|chrome|opera|version).*?([\d.]+)/;
        var m = ua.match(re);
        Sys.browser = m[1].replace(/version/, "'safari");
        Sys.ver = m[2];
        return Sys;
    }

    function printLog(log) {
        var sys = getBrowserInfo();
        if ("msie" != sys.browser || ("msie" == sys.browser && parseInt(sys.ver) > 9)) {
            console.log(log);
        }
    };
    window.printLog = printLog;
    window.getBrowserInfo = getBrowserInfo;
}(window));
//=====================================================
//=====================================================
//拓扑组件
//=====================================================
//=====================================================
(function (win) {
    //拓扑入口对象
    function LJTopo() {
        this.author = "刘植鑫"
        this.phoneNo = "18310134697"
        this.email = "zxliuzx@163.com"
        this.versionTime = "2018/12/12";//冬至吃饺子
        this.version = "1.0.0";//版本号
        this.zoomIn = 0.95;//缩小
        this.zoomOut = 1.05;//放大
        this.zoomOutCn = "放大";
        this.zoomInCn = "缩小";
        this.maxNumber = 10000000000;
        this.minNumber = -10000000000;
        var self = this;
        //创建一个画布
        this.createBoard = function (canvasId) {
            var canvas = document.getElementById(canvasId);
            var ctx = canvas.getContext("2d");
            var board = new Board(self, canvas, ctx);
            return board;
        };
    }

    //画板
    function Board(topo, canvas, ctx) {
        this.maxlay = 0;//当前节点层级
        this.width = canvas.width;
        this.height = canvas.height;
        this.elements = [];
        this.images = {};
        this.isDraggable = true; //默认可以拖拽
        this.boardPosition = new BoardPosition();
        this.boardPosition.clearHeight = this.height;
        this.boardPosition.clearWidth = this.width;
        printLog("画板宽高=[" + this.width + "," + this.height + "]");
        var lastMouseMoveX = topo.maxNumber;
        var lastMouseMoveY = topo.maxNumber;
        var isInElement = null;
        canvas.onmousedown = function (event) {
            //鼠标按下键
            canvas.onmousemove = function (e) {
                //鼠标移动键
                if (isInElement == null) {
                    //没有覆盖元素，查询一下是否有覆盖元素
                    isInElement = board.movePointInRangeElement(e)
                }
                if (isInElement != null) {
                    //转化成拓扑坐标
                    var mouseX = e.clientX;
                    var mouseY = e.clientY;
                    if (lastMouseMoveX == topo.maxNumber) {
                        lastMouseMoveX = mouseX;
                        lastMouseMoveY = mouseY;
                    }
                    var moveX = mouseX - lastMouseMoveX;
                    var moveY = mouseY - lastMouseMoveY;
                    lastMouseMoveX = mouseX;
                    lastMouseMoveY = mouseY;
                    isInElement.x = isInElement.x + moveX / board.boardPosition.zoomSum;
                    isInElement.y = isInElement.y + moveY / board.boardPosition.zoomSum;
                    board.reDraw();
                } else {
                    board.mouseMoveEvent(e);
                }


            }
        };
        canvas.onmouseup = function (event) {
            canvas.onmousemove = null;
            lastMouseMoveX = topo.maxNumber;
            lastMouseMoveY = topo.maxNumber;
            isInElement = null;
        };
        //添加组件
        this.add = function (e) {
            //printLog("添加组件");
            e.draw();
            board.elements.push(e);
        };
        /**
         * 根据id返回节点信息
         * @param id
         */
        this.getElementById = function (id) {
            var elements = board.elements;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].id == id) {
                    return elements[i];
                }
            }
            return null;
        };

        /**
         * 移动覆盖的节点元素等信息，符合移动条件则返回true
         * @param e
         * @returns {boolean}
         */
        this.movePointInRangeElement = function (e) {
            if (!board.isDraggable) {
                return null;
            } else {
                var bp = board.boardPosition
                var elements = board.elements;
                var matchi = -1;//符合的索引坐标
                var currentLay = -1;//当前设备层级
                //for循环为了找到符合的最高层节点
                for (var i = 0; i < elements.length; i++) {
                    if (elements[i].type == "rectangle" || "circle" == elements[i].type) {
                        isInElement = elements[i].isPointInRange(e);
                        if (isInElement) {
                            var ly = elements[i].layer;
                            if (ly > currentLay) {
                                currentLay = ly;
                                matchi = i;
                            }
                        }
                    }
                }
                if (matchi != -1) {
                    //找到了最高层
                    elements[matchi].layer = board.maxlay + 1
                    board.maxlay = board.maxlay + 1;

                    return elements[matchi];
                }
                return null;
            }
        };
        this.mouseMoveEvent = function (e) {
            var bp = board.boardPosition
            var mouseX = e.clientX;
            var mouseY = e.clientY;
            if (lastMouseMoveX == topo.maxNumber) {
                lastMouseMoveX = mouseX;
                lastMouseMoveY = mouseY;
            }
            var lastTranslateX = bp.translateX;
            var lastTranslateY = bp.translateY;
            //桌面坐标偏移量
            var moveX = mouseX - lastMouseMoveX;
            var moveY = mouseY - lastMouseMoveY;
            lastMouseMoveX = mouseX;
            lastMouseMoveY = mouseY;
            bp.translateX = bp.translateX + moveX;
            bp.translateY = bp.translateY + moveY;
            ctx.translate(moveX / bp.zoomSum, moveY / bp.zoomSum);
            bp.clearX = 0 - bp.translateX * (1 / bp.zoomSum);
            bp.clearY = 0 - bp.translateY * (1 / bp.zoomSum);
            bp.clearWidth = board.width / bp.zoomSum;
            bp.clearHeight = board.height / bp.zoomSum;
            board.reDraw();
        };

        //添加鼠标滚轮事件
        this.addMouseScrollEvent = function () {
            var sys = getBrowserInfo();
            var browser = sys.browser;
            if ("msie" == browser) {
                canvas.attachEvent("onmousewheel", function (e) {
                    zoomMouseScroll(1, 1, 1);
                });
            } else if ("firefox" == browser) {
                canvas.addEventListener("DOMMouseScroll", function (e) {
                    zoomMouseScroll(2, 2, 2);
                }, false);
            } else {
                canvas.onmousewheel = function (e) {
                    var x = e.clientX;
                    var y = e.clientY;
                    var zoomTpe = e.wheelDelta < 0 ? topo.zoomInCn : topo.zoomOutCn;
                    zoomMouseScroll(zoomTpe, x, y);
                };
            }
            function zoomMouseScroll(type, x, y) {
                if (topo.zoomInCn == type) {
                    board.boardPosition.zoomType = topo.zoomInCn;
                    board.boardPosition.zoom = topo.zoomIn;
                } else {
                    board.boardPosition.zoomType = topo.zoomOutCn;
                    board.boardPosition.zoom = topo.zoomOut;
                }
                printLog("放大，缩小桌面坐标位置=[" + x + "," + y + "]");
                board.zoom(x, y);
            }
        };

        //居中显示
        this.center = function () {
            var elements = board.elements;
            var bp = board.boardPosition;
            var canvasWHP = board.width / board.height;//宽高比
            var minx = topo.maxNumber;
            var miny = topo.maxNumber;
            var maxx = topo.minNumber;
            var maxy = topo.minNumber;
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].type == "rectangle" || "circle" == elements[i].type) {
                    var x = elements[i].x;
                    var y = elements[i].y;
                    var xw = elements[i].width + x;
                    var yh = elements[i].height + y;
                    if (minx > x) {
                        minx = x;
                    }
                    if (miny > y) {
                        miny = y;
                    }
                    if (maxx < xw) {
                        maxx = xw;
                    }
                    if (maxy < yh) {
                        maxy = yh;
                    }
                }
            }
            var cwh = (maxx - minx) / (maxy - miny);//中间区域宽高比
            var centerZoom = 0;
            var deskMixXY = board.getDeskTopPosition(minx, miny);
            minx = deskMixXY.topoX;
            miny = deskMixXY.topoY;
            var deskMaxXY = board.getDeskTopPosition(maxx, maxy);
            maxx = deskMaxXY.topoX;
            maxy = deskMaxXY.topoY;
            if (canvasWHP < cwh) {
                //按照宽度放大
                centerZoom = board.width / (maxx - minx);
            } else {
                //按照高度放大
                centerZoom = board.height / (maxy - miny);
            }
            centerZoom = centerZoom / 1.1
            var log = "需要放大倍数[" + centerZoom + "],所有设备所在区域为[" + minx + "," + miny + "," + maxx + "," + maxy + "]";
            printLog(log);
            var topoCenterX = (minx + maxx) / 2;
            var topoCenterY = (miny + maxy) / 2;
            var moveX = (board.width / 2 - topoCenterX);
            var moveY = (board.height / 2 - topoCenterY);
            bp.translateX = bp.translateX + moveX;
            bp.translateY = bp.translateY + moveY;
            bp.zoom = centerZoom;
            ctx.translate(moveX / bp.zoomSum, moveY / bp.zoomSum);
            //board.reDraw();
            board.calBoardPosition(board.width / 2, board.height / 2);
        };
        //缩小
        this.zoomIn = function () {
            board.boardPosition.zoomType = topo.zoomInCn;
            board.boardPosition.zoom = topo.zoomIn;
            board.zoom(board.width / 2, board.height / 2);
        };
        //放大或者缩小
        this.zoom = function (x, y) {
            board.calBoardPosition(x, y);//计算要移动的坐标信息等
        };

        //放大
        this.zoomOut = function () {
            board.boardPosition.zoomType = topo.zoomOutCn;
            board.boardPosition.zoom = topo.zoomOut;
            board.zoom(board.width / 2, board.height / 2);
        };
        //重新绘制函数
        this.reDraw = function () {
            (function () {
                var bp = board.boardPosition;
                ctx.clearRect(bp.clearX, bp.clearY, bp.clearWidth, bp.clearHeight);
                var elements = board.elements;
                var i = elements.length - 1;
                //TODO  这里需要处理一下层级绘制问题，要不然，顺序就会乱了
                for (; i >= 0; i--) {
                    elements[i].draw();
                }
            })()
        };
        /**
         * 桌面坐标转化成拓扑坐标
         * @param x
         * @param y
         */
        this.getTopoPosition = function (x, y) {
            var bp = board.boardPosition;
            var zoomSum = bp.zoomSum;
            var translateX = bp.translateX;//桌面坐标偏移量
            var translateY = bp.translateY;//桌面坐标偏移量
            var topoX = (x - translateX) / bp.zoomSum;
            var topoY = (y - translateY) / bp.zoomSum;
            var pos = {};
            pos.topoX = topoX;
            pos.topoY = topoY;
            return pos;
        };
        /**
         * 获取桌面坐标
         * @param x 节点坐标
         * @param y 节点坐标
         * @returns {{}}
         */
        this.getDeskTopPosition = function (x, y) {
            var bp = board.boardPosition;
            var zoomSum = bp.zoomSum;
            var translateX = bp.translateX;//桌面坐标偏移量
            var translateY = bp.translateY;//桌面坐标偏移量
            var topoX = translateX + x * bp.zoomSum;
            var topoY = translateY + y * bp.zoomSum;
            var pos = {};
            pos.topoX = topoX;
            pos.topoY = topoY;
            return pos;
        };
        /**
         * 计算画板的位置坐标等信息
         * @param zoom 放大缩小倍率
         * @param zoomX 放大缩小中心点桌面x坐标
         * @param zoomY 放大缩小中心点桌面y坐标
         */
        this.calBoardPosition = function (pointX, pointY) {
            var bp = board.boardPosition;
            var lastTranslateX = bp.translateX;
            var lastTranslateY = bp.translateY;
            bp.translateX = (pointX - lastTranslateX) * (1 - bp.zoom) + lastTranslateX;//相对于0,0的桌面坐标偏移量
            bp.translateY = (pointY - lastTranslateY) * (1 - bp.zoom) + lastTranslateY;//相对于0,0的桌面坐标偏移量
            var moveX = (bp.translateX - lastTranslateX) / bp.zoomSum;
            var moveY = (bp.translateY - lastTranslateY) / bp.zoomSum;
            var zoomSum = bp.zoomSum * bp.zoom;
            bp.zoomSum = zoomSum;//记录当前放大缩小倍数
            // printLog("画布倍数=["+bp.zoomSum+"],缩放点位置=["+pointX+","+pointY+"],原点移动位置=["+bp.translateX+","+bp.translateY+"]");
            var ioWidth = board.width * bp.zoomSum;//放大缩小后的实际宽度
            var ioHeight = board.height * bp.zoomSum;//放大缩小后的实际高度
            // printLog("canvas相对于桌面大小=["+ioWidth+","+ioHeight+"]");
            bp.clearX = 0 - bp.translateX * (1 / bp.zoomSum);
            bp.clearY = 0 - bp.translateY * (1 / bp.zoomSum);
            bp.clearWidth = board.width / bp.zoomSum;
            bp.clearHeight = board.height / bp.zoomSum;
            //  printLog("本次坐标原点移动=["+moveX+","+moveY+"],可见区域实际坐标["+bp.clearX+","+bp.clearY+","+bp.clearWidth+","+bp.clearHeight+"]");
            ctx.translate(moveX, moveY);
            ctx.scale(bp.zoom, bp.zoom);
            board.reDraw();
        };
        /**
         * 创建节点
         * @param name 节点名称
         * @param x
         * @param y
         * @returns {Node}
         */
        this.createNode = function (name, x, y) {
            var node = new Node(ctx, name, x, y);
            node.layer = board.maxlay;
            board.maxlay = board.maxlay + 1;
            return node;
        };
        /**
         * 创建线
         * @param name 线名称
         * @param nodeStart
         * @param nodeEnd
         * @param type 默认为单线，只显示名称
         * @returns {Line}
         */
        this.createLink = function (name, nodeStart, nodeEnd, type) {
            var l = new Line(ctx, name, nodeStart, nodeEnd, type);
            return l;
        };
        this.addMouseScrollEvent();//调用鼠标滚轮事件
        var board = this;

    }

    /**
     * 节点
     * @param ctx
     * @param name
     * @param x
     * @param y
     * @constructor
     */
    function Node(ctx, name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.id = Math.random();
        this.imageUrl = "";//图片绝对位置
        this.width = 30;
        this.radius = 15;//半径，圆的时候生效
        this.height = 30;
        this.type = "rectangle";//默认为长方形,rectangle 长方形，circle 圆形
        this.fillStyle = "#15B4EC";
        this.strokeWidth = 1;
        this.strokeStyle = "";
        this.fontStyle = "";
        this.isPointInRange = function (e) {
            var pointx = e.offsetX;//相对屏幕坐标点
            var pointy = e.offsetY;//相对屏幕坐标点
            var canvasXY = board.getTopoPosition(pointx, pointy);
            var canvasX = canvasXY.topoX;
            var canvasY = canvasXY.topoY;
            if (node.x < canvasX && canvasX < (node.x + node.width) && node.y < canvasY && canvasY < (node.y + node.height)) {
                return true;
            } else {
                //console.log("节点外:"+log);
                return false;
            }
        };
        /**
         * 绘制节点
         */
        this.draw = function () {
            if (node.imageUrl == "") {
                if (node.type == "circle") {
                    node.drawCircle();
                } else {
                    node.drawRectangle();
                }
            } else {
                node.drawImage();
            }
        };
        /**
         * 绘制长方形
         */
        this.drawRectangle = function () {
            //绘制节点
            ctx.save();
            ctx.fillStyle = node.fillStyle;
            ctx.fillRect(node.x, node.y, node.width, node.height);
            ctx.restore();
            //绘制边框
            ctx.save();
            ctx.strokeStyle = node.strokeStyle;
            ctx.lineWidth = node.strokeWidth;
            ctx.strokeRect(node.x, node.y, node.width, node.height);
            ctx.restore();
            var nameLength = node.name.getStringLength();
            node.drawText(node.name, node.x, node.y + node.height, node.width * 3);
        };
        /**
         * 绘制圆形
         */
        this.drawCircle = function () {
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = node.strokeStyle;
            ctx.arc(node.x + node.radius, node.y + node.radius, node.radius, 0, 360 / Math.PI, false);
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = node.fillStyle;
            ctx.fill();
            ctx.restore();
            node.height = node.radius * 2;
            node.width = node.radius * 2;
            var nameLength = node.name.getStringLength();
            node.drawText(node.name, node.x, node.y + node.height, node.width * 3);
        };
        /**
         * 绘制图片
         */
        this.drawImage = function () {
            var url = node.imageUrl;
            var loadEnd = board.images[url];
            if (loadEnd) {
                //存在此图片
                node.drawImage2canvas(loadEnd);
            } else {
                //不存在，则加载
                var img = new Image();
                img.src = url;
                if (img.complete) {
                    board.images[url] = img;
                    node.drawImage2canvas(img);
                } else {
                    img.onload = function () {
                        board.images[url] = img;
                        node.drawImage2canvas(img);
                    };
                    img.onerror = function () {
                        window.alert('图片加载，请重试');
                    };
                }
            }
        };
        this.drawImage2canvas = function (img) {
            ctx.save();
            ctx.drawImage(img, node.x, node.y);
            ctx.strokeStyle = node.strokeStyle;
            ctx.lineWidth = 1;
            ctx.strokeRect(node.x, node.y, node.width, node.height);
            ctx.restore();
            node.drawText(node.name, node.x, node.y + node.height, node.width * 3);
        }

        /**
         * 添加文字
         * @param name 节点名称
         * @param x
         * @param y
         * @param width
         */
        this.drawText = function (name, x, y, width) {
            var chr = name.split("");
            var temp = "";
            var row = [];
            ctx.fillStyle = "black";
            for (var a = 0; a < chr.length; a++) {
                if (ctx.measureText(temp).width < width) {
                    ;
                }
                else {
                    row.push(temp);
                    temp = "";
                }
                temp += chr[a];
            }
            row.push(temp);
            for (var b = 0; b < row.length; b++) {
                var length = row[b].getStringLength();
                ctx.fillText(row[b], (x + this.width / 2) - (length / 2) * 5, y + (b + 1) * 12);
            }
        };
        var node = this;
    }

    //线
    function Line(ctx, name, nodeStart, nodeEnd, type) {
        this.id = Math.random();
        this.name = name;
        this.nodeStart = nodeStart;
        this.nodeEnd = nodeEnd;
        this.type = "line";
        this.arrows = 0;
        this.lineStyle="#FF0000";
        this.arrowsDynamic=1;
        this.data = {
            start: {
                info: "12500000GB",
                showArraw: true,
                arrayStyle: "#006030"
            },
            end: {
                info: "50000000GB",
                showArraw: true,
                arrayStyle: "#FF0000"//红色
            }
        };//要呈现的数据信息
        this.draw = function () {//绘制线条
            //先实现矩形节点，后期可以实现原型节点等等
            if("line"==link.type){
                link.commonDraw();
            }else if("arrowsLine"==link.type){
                link.arrowsLineDraw();
            }

        };
        this.arrowsLineDraw=function(){
            var startXY=null,endXY=null;
            if(link.nodeStart.type=="circle"){
                startXY=link.getArcXY(link.nodeStart,link.nodeEnd.x,link.nodeEnd.y)
            }else{
                startXY=link.getRectXY(link.nodeStart,link.nodeEnd.x,link.nodeEnd.y)
            }
            var startx=startXY.x;
            var starty=startXY.y;
            if(link.nodeEnd.type=="circle"){
                endXY=link.getArcXY(link.nodeEnd,link.nodeStart.x,link.nodeStart.y)
            }else{
                endXY=link.getRectXY(link.nodeEnd,link.nodeStart.x,link.nodeStart.y)
            }
            var endx=endXY.x;
            var endy=endXY.y;
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle=line.lineStyle;
            ctx.moveTo(startx, starty);
            ctx.lineTo(endx, endy);
            ctx.closePath();
            ctx.stroke();
            ctx.translate(endx, endy);
            var width=endx - startx;
            var height=endy - starty;
            var tan=Math.atan(height / width)
            ctx.rotate(tan);
            ctx.lineWidth=2;
            ctx.beginPath();
            if(width>0){
                ctx.moveTo(-8, -8);
                ctx.lineTo(0,0);
                ctx.lineTo(-8,8);
            }else{
                ctx.moveTo(8, -8);
                ctx.lineTo(0,0);
                ctx.lineTo(8,8);
            }
            printLog("tan="+tan);
            ctx.stroke();
            ctx.restore();

          link.drawText(link.name, startx + (endx - startx) / 2, starty + (endy - starty) / 2, 100, (endy - starty) / (endx - startx));
        }

        /**
         * 普通线
         */
        this.commonDraw = function () {
            var startXY=null,endXY=null;
            if(link.nodeStart.type=="circle"){
                startXY=link.getArcXY(link.nodeStart,link.nodeEnd.x,link.nodeEnd.y)
            }else{
                startXY=link.getRectXY(link.nodeStart,link.nodeEnd.x,link.nodeEnd.y)
            }
            var startx=startXY.x;
            var starty=startXY.y;
            if(link.nodeEnd.type=="circle"){
                endXY=link.getArcXY(link.nodeEnd,link.nodeStart.x,link.nodeStart.y)
            }else{
                endXY=link.getRectXY(link.nodeEnd,link.nodeStart.x,link.nodeStart.y)
            }
            var endx=endXY.x;
            var endy=endXY.y;
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle=line.lineStyle;
            ctx.moveTo(startx, starty);
            ctx.lineTo(endx, endy);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
            if (link.data == null) {
                link.drawText(link.name, startx + (endx - startx) / 2, starty + (endy - starty) / 2, 100, (endy - starty) / (endx - startx));
            } else {
                link.drawlineInfo(link.data.start, startx + (endx - startx) / 2, starty + (endy - starty) / 2, 100, (starty - endy ) / (startx - endx ), startx - endx,"1");
                link.drawlineInfo(link.data.end, startx + (endx - startx) / 2, starty + (endy - starty) / 2, 100, (starty - endy ) / (startx - endx ), startx - endx,"2");
            }
        }
        /**
         *
         * @param ctx
         * @param name
         * @param x
         * @param y
         * @param width
         * @param rotate 旋转角度
         */
        this.drawText = function (name, x, y, width, rotate) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.atan(rotate));
            var tlength = name.getStringLength();
            ctx.fillText(name, -(tlength / 2) * 5, -3);
            ctx.restore();
        };

        this.getRectXY=function (node,endX,endY){
            var xy={
                x:node.x+node.width/2,
                y:node.y+node.height/2
            };
            var width=endX-node.x;
            var height=endY-node.y;
            if(width==0){
                xy.y=xy.y+(endY-node.y>0?node.height/2:(0-node.height/2));
            }else if(height==0){
                xy.x=xy.x+(endX-node.x>0?node.width/2:(0-node.width/2));
            }else{
                if(Math.abs(height)-Math.abs(width)>0){
                    xy.y=xy.y+(endY-node.y>0?node.height/2:(0-node.height/2));
                    xy.x=xy.x+width*(node.height/2)/Math.abs(height);
                }else{
                    xy.y=xy.y+height*(node.width/2)/Math.abs(width);
                    xy.x=xy.x+(endX-node.x>0?node.width/2:(0-node.width/2));
                }
            }
            return xy;
        };
        this.getArcXY=function (arc,endX,endY){
            var xy={
                x:arc.x + arc.radius,
                y:arc.y+ arc.radius
            };
            var width=endX-arc.x;
            var height=endY-arc.y;
            if(width==0){
                xy.y=xy.y+(endY-arc.y>0?arc.radius:(0-arc.radius));
            }else if(height==0){
                xy.x=xy.x+(endX-arc.x>0?arc.radius:(0-arc.radius));
            }else{
                var tanhd=Math.atan(height/width);//弧度
                var yy=arc.radius*Math.sin(tanhd);
                var xx=arc.radius*Math.cos(tanhd);
                xy.x=xy.x+(width>0?xx:(0-xx));
                xy.y=xy.y+(width>0?yy:(0-yy));
            }
            return xy
        };

        /**
         * 绘制普通线条多信息
         * @param lineInfo
         * @param x
         * @param y
         * @param width
         * @param rotate
         * @param lineDistance
         * @param startOrEnd
         */
        this.drawlineInfo = function (lineInfo, x, y, width, rotate, lineDistance,startOrEnd) {
            var info = lineInfo.info;
            var showArraw = lineInfo.info;
            var arrayStyle = lineInfo.arrayStyle;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.atan(rotate));
            var tlength = ctx.measureText(info).width;
            ctx.textBaseline = "middle";
            var tipTX=13;
            var tipTY=10;

            if (lineDistance <0) {//开始节点在左侧
                if("1"==startOrEnd){
                    ctx.fillText(info, 0-(tlength / 2) -tipTX, 0-tipTY);
                }else{
                    ctx.fillText(info, 0-(tlength / 2)+tipTX, tipTY);
                }
            } else {
                if("1"==startOrEnd){
                    ctx.fillText(info, 0-(tlength / 2)+tipTX, tipTY);
                }else{
                    ctx.fillText(info, 0-(tlength / 2)-tipTX, 0-tipTY);
                }
            }
            ctx.restore();
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.atan(rotate));
           // printLog(info + ":lineDistance=" + lineDistance);
            if (showArraw) {
                ctx.strokeStyle = arrayStyle;
                ctx.lineWidth=2;
                if (lineDistance <0) {//开始节点在左侧
                    if("1"==startOrEnd){
                        ctx.beginPath();
                        ctx.moveTo((tlength / 2) -tipTX+5, -15);
                        ctx.lineTo((tlength / 2) -tipTX+13, -10);
                        ctx.lineTo((tlength / 2) -tipTX+5, -5);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo((tlength / 2) -tipTX+12, -15);
                        ctx.lineTo((tlength / 2) -tipTX+20, -10);
                        ctx.lineTo((tlength / 2) -tipTX+12, -5);
                        ctx.stroke();
                    }else{
                        ctx.beginPath();
                        ctx.moveTo(0-(tlength / 2) +tipTX-5, 15);
                        ctx.lineTo(0-(tlength / 2) +tipTX-13, 10);
                        ctx.lineTo(0-(tlength / 2) +tipTX-5, 5);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(0-(tlength / 2) +tipTX-12, 15);
                        ctx.lineTo(0-(tlength / 2) +tipTX-20, 10);
                        ctx.lineTo(0-(tlength / 2) +tipTX-12, 5);
                        ctx.stroke();
                    }
                } else {
                    if("1"==startOrEnd){
                        ctx.beginPath();
                        ctx.moveTo(0-(tlength / 2) +tipTX-5, 15);
                        ctx.lineTo(0-(tlength / 2) +tipTX-13, 10);
                        ctx.lineTo(0-(tlength / 2) +tipTX-5, 5);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(0-(tlength / 2) +tipTX-12, 15);
                        ctx.lineTo(0-(tlength / 2) +tipTX-20, 10);
                        ctx.lineTo(0-(tlength / 2) +tipTX-12, 5);
                        ctx.stroke();
                    }else{
                        ctx.beginPath();
                        ctx.moveTo((tlength / 2) -tipTX+5, -15);
                        ctx.lineTo((tlength / 2) -tipTX+13, -10);
                        ctx.lineTo((tlength / 2) -tipTX+5, -5);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo((tlength / 2) -tipTX+12, -15);
                        ctx.lineTo((tlength / 2) -tipTX+20, -10);
                        ctx.lineTo((tlength / 2) -tipTX+12, -5);
                        ctx.stroke();
                    }
                }

            }
            ctx.restore();
        };
        var link = this;
    }

    /**
     * 边框位置坐标信息
     * @constructor
     */
    function BoardPosition() {
        this.translateX = 0;//偏移量横坐标 相对于0的桌面偏移量
        this.translateY = 0;//偏移量纵坐标 相对于0的桌面偏移量
        this.zoomSum = 1;
        this.zoom = 1;
        this.clearX = 0;
        this.clearY = 0;
        this.zoomType = "";
        this.clearWidth = 0;
        this.clearHeight = 0;
    }

    win.LJTopo = LJTopo;
}(window));