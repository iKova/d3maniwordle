(function () {

    function maniwordle() {

        var maniwordle = {},
            data = [],
            startx, starty,
            color = dummyColor,
            font = dummyFont,
            weight = dummyWeight,
            rotate = dummyRotate,
            drawTransition = 250,
            svg = d3.select('svg').select('g');

        getNewPos = getBoundings;

        maniwordle.startx = function (x) {
            startx = x;
            return maniwordle;
        };

        maniwordle.starty = function (y) {
            starty = y;
            return maniwordle;
        };

        svg.selectAll("*").remove();

        maniwordle.start = function () {

            svg.selectAll("*").remove();

            data = data.map(function (d, i) {

                d.x = startx;
                d.y = starty;
                d.color = color.call(this, d, i);
                d.font = font.call(this, d, i);
                d.rotate = rotate.call(this, d, i);
                d.weight = ~~(weight.call(this, d, i));
                d.pinned = false;
                return d;

            });

            var textElements = svg.selectAll('text').data(data);

            var drag = d3.behavior.drag()
                .origin(function (d) {
                    return d;
                })
                .on("dragstart", interaction.dragstart)
                .on("drag", interaction.dragmove)
                .on("dragend", interaction.dragend);

            textElements.enter().append('text')
                .attr('id', function (d) {
                    return d.text
                })
                .attr('font-size', function (d) {
                    return d.weight;
                })
                .attr('text-anchor', 'middle')
                .text(function (d) {
                    return d.text;
                })
                .call(drag)
                .on("mouseover", function () {
                    d3.select(this).style("cursor", "pointer");
                })
                .on('click', interaction.isSelected);

            textElements.exit().remove();

            maniwordle.redraw(false, 0);

            data = data.map(function (d, i) {

                bb = textElements[0][i].getBBox();

                d.width = bb.width * 1.1;
                d.height = bb.height * (2 / 3);

                return d;
            });

            maniwordle.redraw(true, 0);
        };

        maniwordle.redraw = function (recalculatePosition, transTime) {

            // TO DO: redraw asynchronously (allows for progress to be displayed!
            //d3.select("body").style("cursor", "progress");

            if (recalculatePosition) {

                data = data.map(function (d, i) {

                    if (!d.pinned) {
                        newPosition = getNewPos.call(this, d, i);
                        d.x = newPosition[0];
                        d.y = newPosition[1];
                    }
                    //d3.select('#doneSign').text(+(i + 1) + '');
                    return d;
                });

            }

            g.selectAll('text')
                .data(data)
                .transition().duration(transTime)
                .attr('fill', function (d, i) {
                    return d.color;
                })
                .attr('font-family', function (d, i) {
                    return d.font;
                })
                .attr('transform', function (d, i) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                });

            //d3.select("body").style("cursor", "auto");
        };

        maniwordle.words = function (x) {

            if (!arguments.length) return data;
            data = x;
            return maniwordle;

        };

        maniwordle.weight = function (x) {

            if (!arguments.length) return weight;
            weight = d3.functor(x);
            return maniwordle;

        };

        maniwordle.color = function (x) {

            if (!arguments.length) return color;
            color = d3.functor(x);
            return maniwordle;

        };

        maniwordle.font = function (x) {

            if (!arguments.length) return font;
            font = d3.functor(x);
            return maniwordle;

        };

        maniwordle.rotate = function (x) {

            if (!arguments.length) return rotate;
            rotate = d3.functor(x);
            return maniwordle;

        };

        maniwordle.interaction = function () {

            var interaction = {};
            var dragging = 0;

            interaction.isSelected = function (d) {

                if (d3.event.defaultPrevented) return;

                if (d.selected) {

                    interaction.unselect(d);

                } else {

                    interaction.pin(d);
                    interaction.select(d);
                }

            };

            interaction.select = function (d) {

                // unselect currently selected word first
                d_old = getSelectedWord();
                if (d_old != null) interaction.unselect(d_old);

                d.selected = true;
                svg.select('#' + d.text).attr('text-decoration', 'underline');

                // populate with selection values
                d3.select("#rotation").property("value", d.rotate + "");
                d3.select("#colorpicker").property("value", d.color);
                d3.select("#fontpicker").property("value", d.font);
            };

            interaction.unselect = function (d) {

                d.selected = false;
                svg.select('#' + d.text).attr('text-decoration', '');

            };

            interaction.pin = function (d) {

                d.pinned = true;
            };

            interaction.unpin = function (d) {

                d.pinned = false;
            };

            interaction.unpinAll = function (d) {

                data = data.map(function (d, i) {

                    d.pinned = false;
                    return d;

                });

            };

            interaction.unpinSelected = function () {

                d = getSelectedWord();
                if (d != null) {
                    d.pinned = false;
                } else {
                    alert('Please select a word first!');
                }

            };

            interaction.dragstart = function (d) {

                dragging = 0;
                //d3.event.sourceEvent.stopPropagation();

            };

            interaction.dragmove = function (d) {

                dragging++;
                d3.event.sourceEvent.stopPropagation();
                d.x = d3.event.x;
                d.y = d3.event.y;
                d3.select(this)
                    .attr('transform', 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')');

            };

            interaction.dragend = function (d) {

                // Chrome always fires a dragmove event, even on clicks
                // therefore recognize a dragend only when 2+ events have fired

                if (dragging > 1) {

                    interaction.pin(d);
                    interaction.select(d);
                    maniwordle.redraw(true, drawTransition);

                    d3.event.sourceEvent.stopPropagation();
                }

                // else allow the event to bubble up to the mouseclick!

            };

            interaction.redrawUnpinned = function () {

                data = data.map(function (d, i) {

                    if (!d.pinned) {
                        d.x = startx;
                        d.y = starty;
                    }
                    return d;

                });
                maniwordle.redraw(true, drawTransition);

            };

            interaction.highlightPinned = function () {

                var values = data.map(function (d, i) {
                    return d.weight
                });
                var greyScale = d3.scale.quantile()
                    .domain(values)
                    .range(["#eee", "#ddd", "#ccc", "#bbb", "#aaa"]);

                data = data.map(function (d, i) {

                    if (d.pinned) {
                        d.color = 'black';
                    } else {
                        d.color = greyScale(d.weight);
                    }
                    return d;
                });

                maniwordle.redraw(false, 0);

            };

            interaction.unHighlightPinned = function () {

                data = data.map(function (d, i) {

                    if (d.userColor) {

                        d.color = d.userColor;

                    } else {

                        d.color = maniwordle.color().call(this, d, i);

                    }


                    return d;

                });

                maniwordle.redraw(false, 0);

            };

            interaction.changeColor = function () {

                d = getSelectedWord();
                var color = d3.select("#colorpicker").property("value");
                d.userColor = d.color = color;

                svg.select('#' + d.text).attr('fill', color);
                //maniwordle.redraw(true, drawTransition);
            };

            interaction.changeFont = function () {

                d = getSelectedWord();
                var font = d3.select("#fontpicker").property("value");
                d.font = font;

                svg.select('#' + d.text).attr('font-family', font);
                //maniwordle.redraw(true, drawTransition);
            };

            interaction.rotateSelection = function () {

                newAngle = +d3.select('#rotation').property('value');

                if (Number.isNaN(newAngle)) {

                    alert('Please enter a valid number!');

                } else {

                    d = getSelectedWord();
                    d.rotate = newAngle;

                    maniwordle.redraw(true, drawTransition);
                }
            };

            function getSelectedWord() {

                for (var i = 0; i < data.length; i++) {
                    if (data[i].selected) return data[i];
                }

                return null;
            }

            interaction.loadTextsource = function () {

                var rawText = d3.select('#textsource').property('value');
                var wordnumb = d3.select('#wordnumb').property('value');

                var stoprem = d3.select('#stoprem').property('checked');
                var punctrem = d3.select('#punctrem').property('checked');
                var numbrem = d3.select('#numbrem').property('checked');

                var prepText = getPreprocessedText(rawText, stoprem, punctrem, numbrem);

                data = getDataFromText(prepText, wordnumb);

                return data;
            };

            function getPreprocessedText(text, stoprem, punctrem, numbrem) {

                if(stoprem) {
                    var stopwords = getStopwords();
                    for(var i=0; i < stopwords.length; i++) {
                        text = text.replace(" " + stopwords[i] + " "," ");
                    }
                }

                if(punctrem) {
                    text = text.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, "");
                }

                if(numbrem) {
                    text = text.replace(/[0-9]/g, '');
                }

                return text;
            }

            function getDataFromText(str, wordnumb) {

                str = trimWhitespaces(str);

                var split = str.split(" "), obj = {};

                for (var x = 0; x < split.length; x++) {

                    if (obj[split[x]] === undefined) {
                            obj[split[x]] = 1;
                    } else {
                        obj[split[x]]++;
                    }
                }

                var data = new Array();

                //var len =  Object.keys(obj).length;
                var len = wordnumb;

                for (var i = 0; (i < len && i < Object.keys(obj).length); i++) {
                    data.push({
                        text: Object.keys(obj)[i],
                        weight: obj[split[i]]
                    });
                }

                return data;
            }

            return interaction;
        };

        function trimWhitespaces(str) {
            str = str.replace(/\s\s+/g, ' ');
            str = str.replace(/^\s+/, '');
            for (var i = str.length - 1; i >= 0; i--) {
                if (/\S/.test(str.charAt(i))) {
                    str = str.substring(0, i + 1);
                    break;
                }
            }
            return str;
        }

        function drawHighlightBox(d) {

            points = getRotatedEdgePoints(d);
            drawArrow(points[0].x, points[0].y, points[1].x, points[1].y, 2, "black");
            drawArrow(points[1].x, points[1].y, points[2].x, points[2].y, 2, "black");
            drawArrow(points[2].x, points[2].y, points[3].x, points[3].y, 2, "black");
            drawArrow(points[3].x, points[3].y, points[0].x, points[0].y, 2, "black");
        }

        function drawArrow(startX, startY, endX, endY, strokeWidth, c) {
            svg.append('line').attr({
                "class": "highlight",
                "x1": startX,
                "y1": startY,
                "x2": endX,
                "y2": endY,
                "marker-end": "url(#triangle)",
                "stroke": c,
                "stroke-width": strokeWidth
            });
        }

        function getBoundings(d, idx) {

            // save the original center
            var orig_x = d.x, orig_y = d.y;
            var sign = Math.random() < .5 ? 1 : -1;
            var angleDev = Math.random() * (0.3 - 0.05) + 0.1;
            var stopCounter = 0;

            var bigRect = data.slice(0, idx);
            // add all pinned Elements
            bigRect = bigRect.concat(getPinnedElements());

            if (intersectBiggerRect(bigRect, d)) {

                var spiralPoint, n = 0;

                do {
                    spiralPoint = getNextSpiralPoint(n, angleDev, orig_x, orig_y, sign);

                    n += 1;

                    if (stopCounter == 1000) {
                        break;
                    }

                    // continue if spiral point is out of bounds
                    if (spiralPoint[0] < 0 || spiralPoint[0] > (width - d.width) || spiralPoint[1] < 0 || spiralPoint[1] > (height - d.height)) {
                        stopCounter++;
                        continue;
                    }

                    d.x = spiralPoint[0];
                    d.y = spiralPoint[1];

                } while (intersectBiggerRect(bigRect, d) || !withinBorders(d));
            }

            return [d.x, d.y];
        }

        function getPinnedElements() {

            var pinnedArr = [];

            for (var i = 0; i < data.length; i++) {
                if (data[i].pinned) pinnedArr.push(data[i]);
            }

            return pinnedArr;
        }

        function getRotatedEdgePoints(rect) {

            var edgePoints = [];

            // left top point
            var rxry = getRotatedXY(rect.x - rect.width / 2, rect.y - rect.height, rect.x, rect.y, rect.rotate);
            edgePoints.push({x: rxry[0], y: rxry[1]});

            // right top point
            rxry = getRotatedXY(rect.x + rect.width / 2, rect.y - rect.height, rect.x, rect.y, rect.rotate);
            edgePoints.push({x: rxry[0], y: rxry[1]});

            // right bottom point
            rxry = getRotatedXY(rect.x + rect.width / 2, rect.y, rect.x, rect.y, rect.rotate);
            edgePoints.push({x: rxry[0], y: rxry[1]});

            // left bottom point
            rxry = getRotatedXY(rect.x - rect.width / 2, rect.y, rect.x, rect.y, rect.rotate);
            edgePoints.push({x: rxry[0], y: rxry[1]});

            //drawCircle(2, rxry[0], rxry[1], "green", 0);

            return edgePoints;
        }

        function withinBorders(rect) {

            var pointsRect = getRotatedEdgePoints(rect);

            for(var i=0; i<pointsRect.length; i++) {
                if(pointsRect[i].x < (0 + margin.left) || pointsRect[i].x > (width - margin.right))
                    return false;

                if(pointsRect[i].y < (0 + margin.top) || pointsRect[i].y > (height - margin.bottom))
                    return false
            }

            return true;
        }

        function getRotatedXY(x, y, centerX, centerY, angle) {
            var cos = Math.cos;
            var sin = Math.sin;
            var a = angle * Math.PI / 180; // Convert to radians

            // Subtract midpoints, so that midpoint is translated to origin and add it in the end again
            var xr = (x - centerX) * cos(a) - (y - centerY) * sin(a) + centerX;
            var yr = (x - centerX) * sin(a) + (y - centerY) * cos(a) + centerY;

            return [xr, yr];
        }

        function getNextSpiralPoint(n, angleDev, centerX, centerY, sign) {
            var angle = angleDev * n * sign;
            var x = (1 + angle) * Math.cos(angle);
            var y = (1 + angle) * Math.sin(angle);

            x += centerX;
            y += centerY;

            return [x, y];
        }

        function intersectBiggerRect(rect_array, rect) {

            var intersection = false;

            for (var i = 0; i < rect_array.length; i++) {
                if (doRotatedRectsIntersect(rect_array[i], rect)) {
                    intersection = true;
                    break;
                }
            }

            return intersection;
        }

        function doRotatedRectsIntersect(rect1, rect2) {
            /*
             Collusion detection using Separating Axis Theorem.
             https://github.com/jriecken/sat-js
             */

            var pointsRect1 = getRotatedEdgePoints(rect1); // contains lt-, rt-, rb-, lb-edge point
            var pointsRect2 = getRotatedEdgePoints(rect2);

            var V = SAT.Vector;
            var P = SAT.Polygon;

            // polygons start to set points clock wise from left upper corner
            // each new vector is drawn from left upper corner
            var polygon1 = new P(new V(pointsRect1[0].x, pointsRect1[0].y), [
                new V(0, 0),
                new V(pointsRect1[1].x - pointsRect1[0].x, pointsRect1[1].y - pointsRect1[0].y),
                new V(pointsRect1[2].x - pointsRect1[0].x, pointsRect1[2].y - pointsRect1[0].y),
                new V(pointsRect1[3].x - pointsRect1[0].x, pointsRect1[3].y - pointsRect1[0].y)]);

            var polygon2 = new P(new V(pointsRect2[0].x, pointsRect2[0].y), [
                new V(0, 0),
                new V(pointsRect2[1].x - pointsRect2[0].x, pointsRect2[1].y - pointsRect2[0].y),
                new V(pointsRect2[2].x - pointsRect2[0].x, pointsRect2[2].y - pointsRect2[0].y),
                new V(pointsRect2[3].x - pointsRect2[0].x, pointsRect2[3].y - pointsRect2[0].y)]);

            var response = new SAT.Response();
            var collided = SAT.testPolygonPolygon(polygon1, polygon2, response);
            return collided;
        }

        function dummyRotate() {
            return 0;
        }

        function dummyColor() {
            return 'black';
        }

        function dummyWeight() {
            return 100;
        }

        function dummyFont() {
            return "Arial";
        }

        function getStopwords() {
            // https://code.google.com/p/stop-words/
            return ["I", "a", "about", "an", "are", "as", "at", "be", "by", "com", "for", "from", "how", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "was", "what", "when", "where", "who", "will", "with", "www", "a's", "able", "above", "according", "accordingly", "across", "actually", "after", "afterwards", "again", "against", "ain't", "all", "allow", "allows", "almost", "alone", "along", "already", "also", "although", "always", "am", "among", "amongst", "and", "another", "any", "anybody", "anyhow", "anyone", "anything", "anyway", "anyways", "anywhere", "apart", "appear", "appreciate", "appropriate", "aren't", "around", "aside", "ask", "asking", "associated", "available", "away", "awfully", "b", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "behind", "being", "believe", "below", "beside", "besides", "best", "better", "between", "beyond", "both", "brief", "but","c","c'mon","c's","came","can","can't","cannot","cant","cause","causes","certain","certainly","changes","clearly","co","come","comes","concerning","consequently","consider","considering","contain","containing","contains","corresponding","could","couldn't","course","currently","d","definitely","described","despite","did","didn't","different","do","does","doesn't","doing","don't","done","down","downwards","during","e","each","edu","eg","eight","either","else","elsewhere","enough","entirely","especially","et","etc","even","ever","every","everybody","everyone","everything","everywhere","ex","exactly","example","except","f","far","few","fifth","first","five","followed","following","follows","former","formerly","forth","four","further","furthermore","g","get","gets","getting","given","gives","go","goes","going","gone","got","gotten","greetings","h","had","hadn't","happens","hardly","has","hasn't","have","haven't","having","he","he's","hello","help","hence","her","here","here's","hereafter","hereby","herein","hereupon","hers","herself","hi","him","himself","his","hither","hopefully","howbeit","however","i","i'd","i'll","i'm","i've","ie","if","ignored","immediate","inasmuch","inc","indeed","indicate","indicated","indicates","inner","insofar","instead","into","inward","isn't","it'd","it'll","it's","its","itself","j","just","k","keep","keeps","kept","know","knows","known","l","last","lately","later","latter","latterly","least","less","lest","let","let's","like","liked","likely","little","look","looking","looks","ltd","m","mainly","many","may","maybe","me","mean","meanwhile","merely","might","more","moreover","most","mostly","much","must","my","myself","n","name","namely","nd","near","nearly","necessary","need","needs","neither","never","nevertheless","new","next","nine","no","nobody","non","none","noone","nor","normally","not","nothing","novel","now","nowhere","o","obviously","off","often","oh","ok","okay","old","once","one","ones","only","onto","other","others","otherwise","ought","our","ours","ourselves","out","outside","over","overall","own","p","particular","particularly","per","perhaps","placed","please","plus","possible","presumably","probably","provides","q","que","quite","qv","r","rather","rd","re","really","reasonably","regarding","regardless","regards","relatively","respectively","right","s","said","same","saw","say","saying","says","second","secondly","see","seeing","seem","seemed","seeming","seems","seen","self","selves","sensible","sent","serious","seriously","seven","several","shall","she","should","shouldn't","since","six","so","some","somebody","somehow","someone","something","sometime","sometimes","somewhat","somewhere","soon","sorry","specified","specify","specifying","still","sub","such","sup","sure","t","t's","take","taken","tell","tends","th","than","thank","thanks","thanx","that's","thats","their","theirs","them","themselves","then","thence","there","there's","thereafter","thereby","therefore","therein","theres","thereupon","these","they","they'd","they'll","they're","they've","think","third","thorough","thoroughly","those","though","three","through","throughout","thru","thus","together","too","took","toward","towards","tried","tries","truly","try","trying","twice","two","u","un","under","unfortunately","unless","unlikely","until","unto","up","upon","us","use","used","useful","uses","using","usually","uucp","v","value","various","very","via","viz","vs","w","want","wants","wasn't","way","we","we'd","we'll","we're","we've","welcome","well","went","were","weren't","what's","whatever","whence","whenever","where's","whereafter","whereas","whereby","wherein","whereupon","wherever","whether","which","while","whither","who's","whoever","whole","whom","whose","why","willing","wish","within","without","won't","wonder","would","wouldn't","x","y","yes","yet","you","you'd","you'll","you're","you've","your","yours","yourself","yourselves","z","zero","he'd","he'll","how's","mustn't","shan't","she'd","she'll","she's","when's","why's","abroad","adj","ago","ahead","alongside","amid","amidst","back","backward","backwards","begin","caption","co.","dare","daren't","directly","eighty","end","ending","evermore","fairly","farther","fewer","forever","forward","found","half","hundred","inc.","inside","likewise","low","lower","made","make","makes","mayn't","meantime","mightn't","mine","minus","miss","mr","mrs","needn't","neverf","neverless","ninety","nonetheless","no-one","notwithstanding","one's","opposite","oughtn't","past","provided","recent","recently","round","someday","taking","that'll","that've","there'd","there'll","there're","there've","thing","things","thirty","till","underneath","undoing","unlike","upwards","versus","what'll","what've","whichever","whilst","who'd","who'll","whomever","zero"];
        }

        return maniwordle;
    }

    if (typeof module === "object" && module.exports) module.exports = maniwordle;
    else (d3 || (d3 = {})).maniwordle = maniwordle;

})();
