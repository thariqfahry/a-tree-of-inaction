"use strict";
function width() {return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)}
function height() {return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)}

var svg = d3.select("svg");

//initial d3 selections
var g = svg.append("g"),
link = g.append("g").selectAll(".link"),
node = g.append("g").selectAll(".node"),
textgroup = g.append("g")
var text;

//global variables
var root;
var nodes;
var links;
var simulation;
var urls;
var first_click = true;

//constant params
var truncAmount = 20;
const collisionRadius = 20;
const circleRadius = 10;
const arrangeRadius= 50
const maxSliceLength = 8

//bind main to go button
const go = document.querySelector('#gobutton');
go.addEventListener('click', buttonClicked)

//bind enter key to go button
document.onkeydown = function (e) {
  e = e || window.event;
  switch (e.which || e.keyCode) {
        case 13 : buttonClicked()
            break;
  }
}

function buttonClicked(){
    var base_url = validate(document.querySelector("input#urlinput").value)
    if (base_url.success){
        var params = generateparams(base_url.href);
        go.classList.add("currentlyhidden");
        document.querySelector(".loader").classList.remove("currentlyhidden");

        $.post(params).done(async function (d){
            if (d.success){
                //fade out titles and fade in tutorial div
                document.querySelector("#outer").classList.add("currentlyhidden");

                await new Promise(r => setTimeout(r, 800));
                graphcb(d)

                await new Promise(r => setTimeout(r, 500));
                if (toggle.checked){document.querySelector("div#first.tutorial.dark").classList.remove("currentlyhidden")}
                               else{document.querySelector("div#first.tutorial.light").classList.remove("currentlyhidden")}
                }
                
            //backend error
            else{
                document.querySelector(".loader").classList.add("currentlyhidden");
                go.classList.remove("currentlyhidden");
                document.querySelector("h4#supported").innerHTML = "could not parse page.";
                document.querySelector("h4#supported").classList.add("notransition","error");

                console.log(d.exceptions)            
                }
            })
    }
    else {
        document.querySelector("h4#supported").innerHTML = base_url.error
        document.querySelector("h4#supported").classList.add("notransition","error")
    }
}


//callback containing simulation set up
function graphcb(_data) {
    root = d3.hierarchy(_data.tree);
    root.data.expandable = false

    nodes = root.descendants()
    links = []
    urls = nodes.map(function(d){return d.data.url})

    arrangeNodes(nodes, arrangeRadius, width()/2, height()/2)

    simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-200))
    .force('link', d3.forceLink(links).id(d => d.id).distance(30).strength(0.3))
    //.force('center', d3.forceCenter(width / 2, height / 2).strength(0.01))
    .force("x", d3.forceX(width()/2))
    .force("y", d3.forceY(height()/2))
    .force('collision', d3.forceCollide().radius(collisionRadius))
    .on('tick', ticked);
    restart();

    d3.timeout(addInitial,75);

    $(window).on('resize', restart);
}

//update the simulation and do data joins
function restart() {

    link = link.data(links)
    link = link.join('line')

    node = node.data(nodes)
    node = node.join('circle')
    .attr('r', circleRadius)
    .call(drag(simulation))
    
    text = textgroup.selectAll("a.textanchor").data(nodes)

    text = text.enter().append('a')
    .classed('textanchor', true)
    .call(function(parent){parent.append('text')})
    .merge(text).select('text')
        .text(function(d) {
        if (d.data.name.slice(maxSliceLength)){
            return d.data.name.toLowerCase().slice(0,maxSliceLength)// + '..'
        }
        return d.data.name.toLowerCase()
     })
    .classed('expandable', function(d){return d.data.expandable})
    .on('click', handleClick)
    .call(drag(simulation))
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut);

    textgroup.selectAll("a.textanchor").data(nodes)
    .attr('xlink:href', function (d){
    if (!d.data.expandable){return d.data.url}
    })
    .attr("target", "_blank")

    text.exit().remove()

    simulation.nodes(nodes)
    .force("link").links(links)
    simulation
    .force("x", d3.forceX(width()/2))
    .force("y", d3.forceY(height()/2))
    simulation.alpha(1).restart();
}

function handleClick(event,n){
    if (!first_click){document.querySelector("div#second.tutorial").classList.add("currentlyhidden")}
    if (n.data.expandable)
    {   
        n.data.expandable = false
        var params = generateparams(n.data.url)
        params.n = n
        
        //make a post request
        $.post(params).done(function(r) {
        console.log(r.status);
        
        //if valid data is returned, transform it into links/nodes
        if (r.success){
            
            if(first_click){
            document.querySelector("div#first.tutorial:not(.currentlyhidden)").classList.add("currentlyhidden")
            document.querySelector("div#second.tutorial").classList.remove("currentlyhidden")
            first_click = false;}        

            var _root = d3.hierarchy(r.tree),
            _nodes = _root.descendants(),
            _links = _root.links()
            
            //set initial node positions in a circle that is centered on the clicked node
            arrangeNodes(_nodes, arrangeRadius, n.x, n.y)
            
            //make the source node of all the new links be the clicked node
            for (var i of _links){i.source = this.n}
            
            //remove the 'new' parent node since now nothing is connected to it
            _nodes.splice(_nodes.indexOf(_root), 1)

            //find any references to the grandparent (parent of n) as this will cause a redundant backwards link
            var gpurl = links[links.findIndex(x=>(x.target == this.n))].source.data.url,
            gpindex = _nodes.findIndex(x=>(x.data.url == gpurl))
            
            //if the gp is present in the children, remove it
            if (gpindex > -1){
                _nodes.splice(gpindex, 1)
                _links.splice(_links.findIndex(x=>(x.target.data.url == gpurl)), 1)
            }
            
            //generate a list of all the new urls
            var _urls = _nodes.map(function(d){return d.data.url})
            for (i of _urls){
                //if a url exists anywhere else in the graph, remove its node 
                //and make its link's target be the existing node with that url
                if (urls.includes(i)){
                    var xt = nodes[nodes.findIndex(x=>{return x.data.url == i})], //existing target
                    l = _links[_links.findIndex(x=>{return x.target.data.url == i})]
                    l.target = xt

                    var nti = _nodes.findIndex(x=>{return x.data.url == i}) //find the duplicate node
                    _nodes.splice(nti,1) //remove the node because now it'll be connected to nothing
                }
                //if not, add it to the list of existing urls
                else {urls.push(i)}
            }            
            //finally, update the arrays that will go into the data join, and call restart()
            nodes = nodes.concat(_nodes)
            links = links.concat(_links)
            restart();}
        
        //if not success, don't do anything with the returned data
        else{console.log(r.exceptions);restart()}
        })
    }}

//tick function containing only x-y changes that happen every tick, that do not depend on interaction
function ticked() {
    link.attr('x1', function(d) {
        return shorten(d, truncAmount).source.x
    }).attr('y1', function(d) {
        return shorten(d, truncAmount).source.y
    }).attr('x2', function(d) {
        return shorten(d, truncAmount).target.x
    }).attr('y2', function(d) {
        return shorten(d, truncAmount).target.y
    }).attr('visibility', function(d) {
        return shorten(d, truncAmount).visibility
    })

    node.attr("cx", function(d) {return d.x;})
    .attr("cy", function(d) {return d.y;})

    text.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

}
