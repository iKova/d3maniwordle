(function () {

    function maniwordle() {

        var maniwordle = {},
            data = [],
            startx, starty,
            color = dummyColor,
            weight = dummyWeight,
            rotate = dummyRotate,
            drawTransition = 250,
            svg = d3.select('svg').select('g');

        //boundings = function(d) { return [Math.random() * width, Math.random()*height] };
        getNewPos = getBoundings;

        maniwordle.startx = function (x) {
            startx = x;
            return maniwordle;
        };
        maniwordle.starty = function (y) {
            starty = y;
            return maniwordle;
        };

        maniwordle.start = function () {

            data = data.map(function (d, i) {

                d.x = startx;
                d.y = starty;
                d.color = color.call(this, d, i);
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

                d.width = bb.width;
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
                    d3.select('#doneSign').text(+(i + 1) + '');
                    return d;
                });

            }

            g.selectAll('text')
                .data(data)
                .transition().duration(transTime)
                .attr('fill', function (d, i) {
                    return d.color;
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
                d.color = 'red';
                svg.select('#' + d.text).attr('fill', d.color);

                d3.select("#rotation").property("value", d.rotate + "");
            };

            interaction.unselect = function (d) {

                d.selected = false;
                d.color = maniwordle.color().call(this, d, data.indexOf(d));
                svg.select('#' + d.text).attr('fill', d.color);

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

                    if (!d.selected) {
                        d.color = maniwordle.color().call(this, d, i);
                    } else {
                        d.color = 'red';
                    }
                    return d;

                });

                maniwordle.redraw(false, 0);

            };

            interaction.rotateSelection = function () {

                d = getSelectedWord();
                d.rotate = +d3.select('#rotation').property('value');

                maniwordle.redraw(true, drawTransition);

            };

            function getSelectedWord() {

                for (var i = 0; i < data.length; i++) {

                    if (data[i].selected) return data[i];

                }

                return null;

            }

            return interaction;
        };

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

                    if (stopCounter == 1000) // TODO: IMPLEMENT HANDLING WHEN NO SPACE IS LEFT
                        break;

                    // continue if spiral point is out of bounds
                    if (spiralPoint[0] < 0 || spiralPoint[0] > (width - d.width) || spiralPoint[1] < 0 || spiralPoint[1] > (height - d.height)) {
                        stopCounter++;
                        continue;
                    }

                    d.x = spiralPoint[0];
                    d.y = spiralPoint[1];

                    //console.log("STILL WITHIN BORDERS? " + withinBorders(rectSmaller));

                } while (intersectBiggerRect(bigRect, d)); // TODO CHECK IF WITHIN BORDERS
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

            if (rect.x - rect.width / 2 < 0)
                return false;

            if (rect.x + rect.width / 2 > (width - margin.right))
                return false;

            if (rect.y - rect.height < 0)
                return false;

            if (rect.y > (height - margin.bottom))
                return false;

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

        return maniwordle;
    }

    if (typeof module === "object" && module.exports) module.exports = maniwordle;
    else (d3 || (d3 = {})).maniwordle = maniwordle;

})();