"use strict";

// import System.IO;

var page = require('webpage').create(),
  system = require('system'),
  t, gridview = true, terms,
  baseurl = 'https://www.pedalroom.com',
  searchurl = 'https://www.pedalroom.com/bikes/search?q=',
  gridsuffix = '&view=photogrid',
  resultsfile = '/pedalroom-search-results.html';


if (system.args.length === 1) {
  console.log('Usage: search.js <search term>');
  phantom.exit();
}

// reroute msgs to console 
page.onConsoleMessage = function(msg) {
  console.log(msg);
}

function getLinks() {
  var links = document.querySelectorAll('ul.results li a');
  return Array.prototype.map.call(links, function (i){
    return i.getAttribute('href');
  });
}

function getResults(gridview) {
  if (gridview) {
    var results = document.querySelectorAll('.photogrid a');
    return Array.prototype.map.call(results, function (i){
      var title = i.getAttribute('title').substring(11); // omit 'View Bike, '
      var link = i.getAttribute('href');
      var image = '/p' + i.getElementsByTagName('img')[0].getAttribute('src').substring(2); // change image src from /d/ to /p/
      return {t: title, l: link, i: image};
    });
  }
  else {
    var results = document.querySelectorAll('ul.results li');
    return Array.prototype.map.call(results, function (i){
      var title = i.getElementsByTagName('a')[0].getAttribute('title').substring(11); // omit 'View Bike, '
      var link = i.getElementsByTagName('a')[0].getAttribute('href');
      var image = i.getElementsByTagName('img')[0].getAttribute('src');
      return {t: title, l: link, i: image};
    });
  }
}

function writeResults(file, title, results) {
  console.log("<html>");
  console.log("<head><title>" + title + "</title></head>");
  console.log("<body>");
  console.log("results go here");

  console.log("<ul>");
  for (var i in results) {
    // console.log('{ ' + results[i].t + ", " + results[i].l + ", " + results[i].i);
    console.log("<li>");
    console.log("<a href=\"" + baseurl + results[i].l + "\">");
    console.log("<img src=\"" + baseurl + results[i].i + "\" title=\"" + results[i].t + "\" alt=\"" + results[i].t + "\">");
    console.log("</a>");
    console.log("</li>");

  }
  console.log("</ul>");


  // Arbitrary objects can also be written to the file.
  console.log("</body>");
  console.log("</html>");
}

function writeResultsList(title, results) {
  var html = "<h1>results for: " + title + "</h1>";
  html += "<ul class=\"results\">";
  for (var i in results) {
    // console.log('{ ' + results[i].t + ", " + results[i].l + ", " + results[i].i);
    html += "<li>";
    html += "<a href=\"" + baseurl + results[i].l + "\">";
    html += "<img src=\"" + baseurl + results[i].i + "\" title=\"" + results[i].t + "\" alt=\"" + results[i].t + "\">";
    html += "<span>" + results[i].t + "</span>";
    html += "</a>";
    html += "</li>";

  }
  html += "</ul>";

  // console.log(html);
  return html;
}

function writeResultsPage(title, results) {
  var fs = require("fs"),
    outfile = "results/results-" + title + ".html",
    content;

  content = "<html><head>";
  content += "<link rel=\"stylesheet\" media=\"screen\" href=\"application.css\">";
  content += "<link rel=\"stylesheet\" media=\"screen\" href=\"results.css\">";
  content += "<title>Search results: " + title + "</title></head><body>";
  content += "<div id=\"content\">"
  content += writeResultsList(title, results);
  content += "</div>"
  content += "</body></html>"

  fs.write(outfile, content, 'w');
}


function search(terms, gridview) {
  var searchstring = terms.join('+')
  searchurl = searchurl + searchstring;
  if (gridview) {
    searchurl = searchurl + gridsuffix;
  }
  console.log('Loading ' + searchstring);


  page.open(searchurl, function(status) {
    if (status !== 'success') {
      console.log('FAIL to load ' + searchurl);
    } else {
      t = Date.now() - t;
      console.log('Loading time ' + t + ' msec');

      /** 1 **/
      // var links = page.evaluate(getLinks);
      // for (var i in links) {
      //   console.log(links[i]);
      // }

      /** 2 **/
      // TODO: hanlde no results
      var results = page.evaluate(getResults, gridview);
      // for (var i in results) {
      //   console.log('{ ' + results[i].t + ", " + results[i].l + ", " + results[i].i);
      // }

      /** 3 **/
      // writeResults(resultsfile, system.args[1], results);

      /** 4 **/
      // var resultsHtml = writeResultsList(system.args[1], results);
      // page.setContent(resultsHtml, baseurl);
      // var content = page.content;
      // console.log('Content: ' + content);

      /** 5 **/
      var numbikes = page.evaluate(function (){
        return document.querySelector('#content h1').innerHTML;
      });
      // console.log(numbikes);
      var numpages = page.evaluate(function(){
        var pagelinks = document.querySelectorAll('.pagination a');
        if (pagelinks && pagelinks.length > 1) {
          var lastlink = pagelinks[pagelinks.length - 1].getAttribute('href');
          console.log(lastlink);
          return parseInt(lastlink.slice(lastlink.indexOf("page=")+5), 10);
        }
        return 1;
      });
      console.log("" + numpages + " pages");


      writeResultsPage(searchstring, results);
    }

    phantom.exit();
  });
}



t = Date.now();
terms = Array.prototype.slice.call(system.args, 1);
var results = search(terms, gridview);
// for (var i in results) {
//   console.log('{ ' + results[i].t + ", " + results[i].l + ", " + results[i].i);
// }

// phantom.exit();