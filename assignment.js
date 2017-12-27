//
// Lightspeed Graphics Programming Assignment
//
// Author: Stephen Lundy
// Date: 28/12/2007
//
// This web app supports transformation of four shapes that appear when the page
// is loaded.
//
// The shapes must be selected before they can be manipulated. Multiple shapes
// can be selected by holding the Alt key while clicking to select.
//
// Once shapes have been selected you can translate, rotate or scale
// them by holding down the T, R or S keys. Mouse movement is used to
// control the transformation.
//

var shapeEdgeWidth = 3;
var normalFillColor = 'lightgrey';
var hoverEdgeColor = 'cyan';
var normalEdgeColor = 'black';
var selectedShapeColor = 'blue';

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var mousePos = { x:0, y:0 };
var transformOrigin = { x:0, y:0 };
var transformMode = '';
var oldCanvasX = 0;
var oldCanvasY = 0;
var scaleSpeed = 0.05;

function Shape( pointData ) {
    this.hovered = false;
    this.selected = false;
    this.translate = translateShape;
}

function Polygon( pointData ) {
    this.points = pointData;
    this.hitTest = isPointInPoly;
    this.render = drawPolyShape;
    this.rotate = rotatePolygon;
    this.scale = scalePolygon;
}

Polygon.prototype = new Shape();
Polygon.prototype.constructor = Polygon;

function Circle( pointData ) {
    this.points = pointData;
    this.hitTest = isPointInCircle;
    this.render = drawCircleShape;
    this.rotate = rotateCircle;
    this.scale = scaleCircle;
}

Circle.prototype = new Shape();
Circle.prototype.constructor = Circle;

function setDrawParams( shape )
{
     ctx.lineWidth = shapeEdgeWidth;

     if (shape.hovered)
     {
         ctx.strokeStyle = hoverEdgeColor;
     }
     else
     {
         ctx.strokeStyle = normalEdgeColor;
     }

     if (shape.selected)
     {
         ctx.fillStyle = selectedShapeColor;
     }
     else
     {
         ctx.fillStyle = normalFillColor;
     }
}

function drawCircleShape() {
    ctx.beginPath();

    ctx.arc( this.points[0].x, this.points[0].y, this.points[0].radius, 0, 2 * Math.PI, false );

    setDrawParams( this );

    ctx.stroke();
    ctx.fill();
}

function drawPolyShape() {
    var i;

    ctx.beginPath();
    ctx.moveTo( this.points[0].x, this.points[0].y );

    for (i=1; i<this.points.length; i++)
    {
        ctx.lineTo( this.points[i].x, this.points[i].y );
    }

    ctx.lineTo( this.points[0].x, this.points[0].y );
    ctx.closePath();

    setDrawParams( this );

    ctx.stroke();
    ctx.fill();
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]

function isPointInPoly( pt ) {
    var poly = this.points;

    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
    return c;
}

function isPointInCircle( pt ) {
    var dx = this.points[0].x - pt.x;
    var dy = this.points[0].y - pt.y;

    var dist = Math.sqrt( dx*dx + dy*dy );

    return this.points[0].radius >= dist;
}

function rotatePoint( point, center, angle ) {
    angle *= Math.PI/180;

    var x = Math.cos(angle) * (point.x - center.x) - Math.sin(angle) * (point.y - center.y) + center.x;
    var y = Math.sin(angle) * (point.x - center.x) + Math.cos(angle) * (point.y - center.y) + center.y;

    return { x, y };
}

function adjustCoords( point ) {
    var rect = canvas.getBoundingClientRect();

    return { x: point.x - rect.x, y: point.y - rect.y };
}

function translateShape( params ) {
    for (var p=0; p<this.points.length; p++) {
        this.points[p].x += params.delta.dx;
        this.points[p].y += params.delta.dy;
    }
}

function rotateCircle( params ) {
    var angle = Math.sqrt( params.delta.dx * params.delta.dx + params.delta.dy * params.delta.dy ) % 360;
    var direction = params.delta.dx == 0 ? 1 : Math.abs(params.delta.dx) / params.delta.dx;
    var newOrigin = rotatePoint( this.points[0], params.transformOrigin, angle * direction );

    this.points[0] = { x: newOrigin.x, y: newOrigin.y, radius: this.points[0].radius };
}

function rotatePolygon( params ) {
    var angle = Math.sqrt( params.delta.dx * params.delta.dx + params.delta.dy * params.delta.dy ) % 360;
    var direction = params.delta.dx == 0 ? 1 : Math.abs(params.delta.dx) / params.delta.dx;

    for (var p=0; p<this.points.length; p++) {
        this.points[p] = rotatePoint( this.points[p], params.transformOrigin, angle * direction );;
    }
}

function scalePolygon( params ) {
    var direction = params.delta.dx == 0 ? 1 : Math.abs(params.delta.dx) / params.delta.dx;
    var scaleFactor = 1 + (-scaleSpeed * direction);

    for (var p=0; p<this.points.length; p++) {
        var ox = params.transformOrigin.x;
        var oy = params.transformOrigin.y;

        this.points[p] = { x: (this.points[p].x - ox) * scaleFactor + ox, y: (this.points[p].y - oy) * scaleFactor + oy };
    }
}

function scaleCircle( params ) {
    var direction = params.delta.dx == 0 ? 1 : Math.abs(params.delta.dx) / params.delta.dx;
    var circle = this.points[0];
    var scaleFactor = 1 + (-scaleSpeed * direction);

    var ox = params.transformOrigin.x;
    var oy = params.transformOrigin.y;

    circle.x = (circle.x - ox) * scaleFactor + ox;
    circle.y = (circle.y - oy) * scaleFactor + oy;
    circle.radius *= scaleFactor;
}

function drawTransformOrigin( position )
{
    if (transformMode == 'scale' || transformMode == 'rotate')
    {
        ctx.lineStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo( position.x, position.y-5 );
        ctx.lineTo( position.x, position.y+5 );
        ctx.moveTo( position.x-5, position.y );
        ctx.lineTo( position.x+5, position.y );
        ctx.closePath();
        ctx.stroke();
    }
}

function redraw()
{
    ctx.clearRect(0,0,canvas.width,canvas.height);

    for (var i=0; i<shapes.length; i++)
    {
        setDrawParams( shapes[i] );

        shapes[i].render();
    }

    if (transformMode != '')
    {
        drawTransformOrigin( transformOrigin );
    }
}

function doMouseMove( evt ) {
    mousePos = { x: evt.clientX, y: evt.clientY };

    var mouseCanvPos = adjustCoords( mousePos );
    var delta = { dx: evt.movementX, dy: evt.movementY };

    var transformInfo = { mouseCanvPos, transformOrigin, delta };

    for (var p=0; p<shapes.length; p++)
    {
        var shape = shapes[ p ];

        shape.hovered = shape.hitTest(mouseCanvPos);

        if (transformMode != '' && shape.selected && (delta.dx != 0 || delta.dy != 0))
        {
            if (transformMode == 'translate')
            {
                shape.translate( transformInfo );
            }
            else if (transformMode == 'rotate')
            {
                shape.rotate( transformInfo );
            }
            else if (transformMode == 'scale')
            {
                shape.scale( transformInfo );
            }
        }
    }

    redraw();
}

function doMouseDown( evt ) {
    var canvPos = adjustCoords( { x: evt.clientX, y: evt.clientY } );

    for (var p=0; p<shapes.length; p++)
    {
        var shape = shapes[ p ];

        if (shape.hitTest(canvPos)) {
            shape.selected = !shape.selected;
        }
        else if (!evt.altKey) {
            shape.selected = false;
        }
    }

    redraw();
}

function doKeyDown( evt )
{
    var oldTransformMode = transformMode;

    switch (evt.key.toUpperCase())
    {
        case 'R':
            transformMode = 'rotate';
            break;

        case 'T':
            transformMode = 'translate';
            break;

        case 'S':
            transformMode = 'scale';
            break;
    }

    if (oldTransformMode != transformMode) {
        transformOrigin = adjustCoords( mousePos );
        redraw();
    }
}

function doKeyUp( evt )
{
    switch (evt.key.toUpperCase())
    {
        case 'R':
            if (transformMode = 'rotate') transformMode = '';
            break;

        case 'T':
            if (transformMode = 'translate') transformMode = '';
            break;

        case 'S':
            if (transformMode = 'scale') transformMode = '';
            break;
    }

    redraw();
}

function makeStar( center, radius, numPoints )
{
    var outerStarPoint = { x: center.x, y: center.y - radius };
    var innerStarPoint = { x: center.x, y: center.y - radius * 11/30 };
    var starPoints = [];

    innerStarPoint = rotatePoint( innerStarPoint, center, 180/numPoints );

    for ( var point=0; point<numPoints; point++ )
    {
        starPoints.push( outerStarPoint );
        starPoints.push( innerStarPoint );

        outerStarPoint = rotatePoint( outerStarPoint, center, 360/numPoints );
        innerStarPoint = rotatePoint( innerStarPoint, center, 360/numPoints );
    }

    return new Polygon( starPoints );
}

var shapes=[ new Polygon( [ {x:10, y:10},
                            {x:10, y:110},
                            {x:110, y:110},
                            {x:110, y:10} ] ),

             new Polygon( [ {x:270, y:20},
                            {x:200, y:140},
                            {x:350, y:140} ] ),

             new Circle( [ {x:200, y:400, radius: 60} ] ) ];

shapes.push( makeStar( {x: 480, y: 100}, 80, 5 ) );

canvas.addEventListener( 'mousemove', doMouseMove, false );
canvas.addEventListener( 'mousedown', doMouseDown, false );

window.addEventListener( 'keydown', doKeyDown, true );
window.addEventListener( 'keyup', doKeyUp, true );

redraw();
