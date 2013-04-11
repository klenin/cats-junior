/**
 * TubeCylinder Overlapped Bargraph Tool: tubcylbar.js 
 * 
 * (c) Rob Audenaerde. This code is onder the Creative Commons License: Attribution Non-Commercial No Derivatives (CC BY-NC-ND)
 *
 * Feel free to contact me for commercial options.
 *
 * Depends on the juery.svg plugin writter by Keith Wood.
 */ 

function rgb(factor, red, green, blue)
{
	return "rgb("+Math.round(factor*red)+","+Math.round(factor*green)+","+Math.round(factor*blue)+")";
}


function rgb2(factor, red, green, blue)
{
	return "rgba("+Math.round(factor*red)+","+Math.round(factor*green)+","+Math.round(factor*blue)+",0.8)";
}

var Cylinder = $.inherit({
    __constructor: function(svg, mysettings) {
        this.svg = svg;
        this.mysettings = mysettings;
        this.init();
    },

    init: function() {
        var svg = this.svg;
        var mysettings = this.mysettings;

        var defs = svg.defs();
       
        var cx = 55;    

        var heightratio = 4;
        var index = "__"+Math.random();
        this.index = index;

    ///BAR////  
        var barwidth=80;
        var barheight=mysettings.inner;
        var barx=cx-barwidth/2;
        var bary=350-barheight;
      
        var barrx = barwidth/2;
        var barry = barrx/heightratio;


    ///BASE////   
        var basepad = 10;

        var basewidth = barwidth + 2 * basepad;

        var baseheight = 20;

        var basex = cx - basewidth/2;
        var basey = bary+barheight ;

        var baserx = basewidth/2;
        var basery = baserx/heightratio;

    ///TUBE ///
        var tubepad = 2;

        var tubewidth = barwidth + 2 * tubepad;
        var tubeheight = mysettings.outer;

        var tubex = cx - tubewidth/2;
        var tubey = 350 - tubeheight;

        var tuberx = tubewidth/2;
        var tubery = tuberx/heightratio;

        var tubeopenx = cx - tubewidth/4;

        svg.ellipse(defs,cx, bary, barrx, barry, {id:"bartopje"+index});
        svg.ellipse(defs,cx, basey, baserx, basery, {id:"basetopje"+index});

        var red  =mysettings.red;
        var green=mysettings.green;
        var blue =mysettings.blue;
        //svg.linearGradient(defs, "MyGradient", [["0%", "rgb(80,0,0)"], ["30%", "rgb(255,0,0)"], ["100%", "rgb(80,0,0)"]], "0%", "0%", "100%", "0%");
        
        var medium    = 80;
        var maxi      =255;
        var rgbMedium = rgb(medium, red, green, blue);
        var rgbMax    = rgb(maxi  , red, green, blue);

        svg.linearGradient(defs, "baseGradient"+index, [["0%", rgb(80,1,1,1)], ["30%", rgb(255,1,1,1)], ["100%", rgb(80,1,1,1)]], "0%", "0%", "100%", "0%");
        svg.linearGradient(defs, "barGradient"+index, [["0%", rgbMedium], ["30%", rgbMax], ["100%", rgbMedium]], "0%", "0%", "100%", "0%");

        svg.linearGradient(defs, "tubeBackGradient"+index, [[  "0%", rgb2( 80,1,1,1)], 
                                                            [ "70%", rgb2(255,1,1,1)], 
                                ["100%", rgb2( 160,1,1,1)]], "0%", "0%", "100%", "0%");

        svg.linearGradient(defs, "tubeFrontGradient"+index,[[  "0%", rgb2( 80,1,1,1)], 
                                                            [ "30%", rgb2(220,1,1,1)], 
                                ["100%", rgb2(160,1,1,1)]], "0%", "0%", "100%", "0%");

        svg.linearGradient(defs, "barTopGradient"+index   ,[[  "0%", rgb(120,red,green,blue)], 
                                ["100%", rgb(160,red,green,blue)]], "0%", "0%", "0%", "100%");



        svg.ellipse(defs,cx, bary+barheight, barrx, barry, {id:"barbottom"+index});
        svg.ellipse(defs,cx, basey+baseheight, baserx, basery, {id:"basebottom"+index});

        svg.rect   (defs,barx , bary ,barwidth ,barheight,  {id:"barbar"+index } );
        svg.rect   (defs,basex, basey,basewidth,baseheight, {id:"basebar"+index} );


        svg.ellipse(defs,cx, tubey           , tuberx, tubery, {id:"tubeTopEllipse"+index});
        svg.ellipse(defs,cx, tubey           , barrx , barry , {id:"tubeTopInnerEllipse"+index});
        svg.ellipse(defs,cx, tubey+tubeheight, tuberx, tubery, {id:"tubeBottomEllipse"+index});
        
        svg.rect(defs,tubex,tubey,tubewidth,tubeheight, {id:"tubeBackRect"+index});
       
        var tubeBackClipPath = svg.clipPath(defs,"myTubeBackClipPath"+index);
        svg.use (tubeBackClipPath,"#tubeBackRect"+index);
        svg.use (tubeBackClipPath,"#tubeTopEllipse"+index);

        var tubeFrontClipPath = svg.clipPath(defs,"myTubeFrontClipPath"+index);
        svg.use (tubeFrontClipPath,"#tubeBackRect"+index);
        svg.use (tubeFrontClipPath,"#tubeBottomEllipse"+index);
        
        var barClipPath = svg.clipPath(defs,"mybarclip"+index);
        svg.use (barClipPath,"#barbottom"+index);
        svg.use (barClipPath,"#barbar"+index);

        var baseClipPath = svg.clipPath(defs,"mybaseclip"+index);
        svg.use (baseClipPath,"#basebottom"+index);
        svg.use (baseClipPath,"#basebar"+index);

        var tubeTopBackMask = svg.mask(defs, "myTubeTopMask"+index);
        svg.rect(tubeTopBackMask, 0,0, "100%", "100%", {fill:"white"});
        svg.use (tubeTopBackMask, "#tubeTopInnerEllipse"+index, {fill:"black"});

        var tubeTopBackClip = svg.clipPath(defs, "myTubeTopClip"+index);
        svg.rect(tubeTopBackClip, 0,0, "100%", tubey);    
       
        var tubeTopFrontClip = svg.clipPath(defs, "myTubeTopFrontClip"+index);
        svg.rect(tubeTopFrontClip, 0,tubey, "100%", "100%");    
       
       
        var tubeFrontMask = svg.mask(defs, "myTubeFrontMask"+index);
        svg.rect(tubeFrontMask, 0,0, "100%", "100%", {fill:"white"});
        //svg.rect(tubeFrontMask, 0,0, "100%", "100%", {fill:"black"});
        svg.use (tubeFrontMask, "#tubeTopEllipse"+index, {fill:"black"});

        //basebar
        //svg.rect(basex, basey, basewidth, baseheight+basery, {fill:"url(#baseGradient"+index+")", clipPath:"url(#mybaseclip"+index+")"});

        //basetop
        //svg.use ("#basetopje"+index, {fill:"grey"});

        //tubebar background
        svg.rect(tubex,tubey-tubery,tubewidth,tubeheight+tubery, {fill:"url(#tubeBackGradient"+index+")", clipPath:"url(#myTubeBackClipPath"+index+")"});

        //tube ring back
        svg.use ("#tubeTopEllipse"+index, {fill:rgb(225,red*0.7+0.3, green*0.7+0.3, blue*0.7+0.3), clipPath: "url(#myTubeTopClip"+index+")", mask:"url(#myTubeTopMask"+index+")"});

        //barbar
        svg.rect(barx,bary,barwidth,barheight+barry, {fill:"url(#barGradient"+index+")",clipPath:"url(#mybarclip"+index+")"} );

        //bartop    
        svg.use ("#bartopje"+index, {fill:"url(#barTopGradient"+index+ ")"});

        //tubebar foreground
        svg.rect(tubex, tubey, tubewidth, tubeheight+tubery, {fill:"url(#tubeFrontGradient"+index+")", clipPath:"url(#myTubeFrontClipPath"+index+")" , mask:"url(#myTubeFrontMask"+index+")"});

        //tube ring front
        svg.use ("#tubeTopEllipse"+index, {fill:rgb(225,red*0.7+0.3, green*0.7+0.3, blue*0.7+0.3), clipPath: "url(#myTubeTopFrontClip"+index+")", mask:"url(#myTubeTopMask"+index+")"});

        //svg.rect (cx, bary, 10, barheight, {fill:"black"});
        
        //this should hit the ellipse outside

        //the 'egeds' of the tube 
        //svg.rect(tubeopenx-3, tubey+3, 3, tubeheight+tubery, {fill:rgb2(80,0.5+0.5*red, 0.5+0.5*green, 0.5+0.5*blue), clipPath:"url(#myTubeFrontClipPath"+index+")" , mask:"url(#myTubeTopMask"+index+")"});
        //svg.rect(cx+barwidth/2, tubey, cx+tubewidth/2, tubeheight, {fill:rgb2(80,0.5+0.5*red, 0.5+0.5*green, 0.5+0.5*blue), clipPath:"url(#myTubeFrontClipPath"+index+")" , mask:"url(#myTubeTopMask"+index+")"});

    },

    update: function(inner) {
        this.mysettings.inner = inner;
        var mysettings = this.mysettings;
        var index = this.index;
        var svg = this.svg;
        var defs = svg.defs();
    ///BAR////  
        var cx = 55;    
var heightratio = 4;
        var barwidth=80;
        var barheight=mysettings.inner;
        var barx=cx-barwidth/2;
        var bary=350-barheight;
      
        var barrx = barwidth/2;
        var barry = barrx/heightratio;


    ///BASE////   
        var basepad = 10;

        var basewidth = barwidth + 2 * basepad;

        var baseheight = 20;

        var basex = cx - basewidth/2;
        var basey = bary+barheight ;

        var baserx = basewidth/2;
        var basery = baserx/heightratio;

        svg.use("#bartopje"+index,cx, bary, barrx, barry);
     

        svg.use("#barbottom"+index,cx, bary+barheight, barrx, barry);

        svg.use("#barbar"+index,barx , bary ,barwidth ,barheight );

        var red  =mysettings.red;
        var green=mysettings.green;
        var blue =mysettings.blue;
        var medium    = 80;
        var maxi      =255;
        var rgbMedium = rgb(medium, red, green, blue);
        var rgbMax    = rgb(maxi  , red, green, blue);

        svg.linearGradient(defs, "barGradient"+index, [["0%", rgbMedium], ["30%", rgbMax], ["100%", rgbMedium]], "0%", "0%", "100%", "0%");

        svg.linearGradient(defs, "barTopGradient"+index   ,[[  "0%", rgb(120,red,green,blue)], 
                                ["100%", rgb(160,red,green,blue)]], "0%", "0%", "0%", "100%");

        var barClipPath = svg.clipPath(defs,"mybarclip"+index);
        svg.use (barClipPath,"#barbottom"+index);
        svg.use (barClipPath,"#barbar"+index);


        //barbar
        svg.rect(barx,bary,barwidth,barheight+barry, {fill:"url(#barGradient"+index+")",clipPath:"url(#mybarclip"+index+")"} );

        //bartop    
        svg.use ("#bartopje"+index, {fill:"url(#barTopGradient"+index+ ")"});
    }
});
