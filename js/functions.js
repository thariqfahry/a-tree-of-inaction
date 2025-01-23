"use strict";
//enable animations and focus url box
$(window).on('load', function() {
  document.body.classList.remove("preload");
  document.getElementById('urlinput').focus()
});

//bind switch to light/dark toggle
const toggle = document.querySelector('input[type=checkbox]');
toggle.addEventListener('change', function() {
    const sheet = document.styleSheets[0];
    
    if (this.checked)
    {document.body.classList.remove("lightmode")}
    else
    {document.body.classList.add("lightmode")}
});

function addhttp(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "https://" + url;
    }
    return url;
}

function validate(_url){
    try{
        var url = new URL(addhttp(_url));
        url.protocol = 'https'
        if (url.host == "linktr.ee"){
            if(url.pathname != "/"){return {success:true, href:url.href}}
            else{return {success:false, error:'enter a specific linktree, not the linktr.ee homepage.'}}
        }
        else if (url.host.includes("carrd.co")){
            if(url.hostname.split('.').length > 2){return {success:true, href:url.href}}
            else{return {success:false, error:'enter a specific carrd, not the carrd.co homepage.'}}
        }
        else {return {success:false, error:'unsupported website.'}}
    }
    catch(_){
        console.log(_)
        return {success:false, error:'invalid url.'}
    }
}

function generateparams(url) {
    var cf_args = {
        "url": url,
        "width": 20,
    }

    var ajax_args = {
        url: 'https://atoi-backend-980032900133.europe-west2.run.app',
        data: JSON.stringify(cf_args),
        contentType: "application/json charset=utf-8"
    }
    return ajax_args
}

function arrangeNodes(arr, r, x, y){
    var l = arr.length
    arr.forEach(function(d, i) {
        if (i==0){d.x = x; d.y = y}
        else{
        d.x = r * Math.cos(6.282*i/(l-1)) + x;
        d.y = r * Math.sin(6.282*i/(l-1)) + y;}
    })
}

function addInitial() {
    for (var i in root.links()) {
        links.push(root.links()[i])
    }
    restart();

}

function shorten(d, dist) {
    
    var x0 = d.source.x,
    y0 = d.source.y,
    x1 = d.target.x,
    y1 = d.target.y
    //x0, y0, x1, y1
    var length = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2)
    if (length < dist * 2) {
        return {
            source: {
                x: x0,
                y: y0
            },
            target: {
                x: x1,
                y: y1
            },
            length: false,
            visibility:'hidden'
        }
    }

    var tshort = dist / length,
    tlong = (length - dist) / length,

    x2 = (1 - tshort) * x0 + tshort * x1,
    y2 = (1 - tshort) * y0 + tshort * y1,

    x3 = (1 - tlong) * x0 + tlong * x1,
    y3 = (1 - tlong) * y0 + tlong * y1

    return {
        source: {
            x: x2,
            y: y2
        },
        target: {
            x: x3,
            y: y3
        },
        length: length,
        visibility:'visible'
    }
}

function drag(simulation){
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

function handleMouseOver(){
    d3.select(this).text(function(d){return d.data.name.toLowerCase()})
}

function handleMouseOut(){
    d3.select(this).text(function(d){
        if (d.data.name.slice(maxSliceLength)){
            return d.data.name.toLowerCase().slice(0,maxSliceLength) //+ '..'
            }
            return d.data.name.toLowerCase()
    })
}