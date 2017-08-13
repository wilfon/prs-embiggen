"use strict";

// import System.IO;

var webpage = require('webpage'),
  system = require('system'),
  t, gridview = true, terms,
  baseurl = 'https://www.pedalroom.com',
  searchurl = 'https://www.pedalroom.com/bikes/search?q=',
  gridquery = '&view=photogrid',
  pagequery = '&page=',
  resultsfile = 'results/results-', // results/results-<terms>[-page].html
  resultsurl = 'results-',
  tp = 0, cp = 1;


if (system.args.length === 1) {
  console.log('Usage: search.js <search term>');
  phantom.exit();
}

// reroute msgs to console 
function consoleToConsole(msg) {
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

function writeNavigation(title, navigation) {
  var html = "<ul class=\"pages\">";
  html += "<li class=\"top\"><a href=\"results.html\">⋀</a></li>";

  if (navigation.lastPage == 1) {
    html += "</ul>";
    return html;
  }


  if (navigation.currentPage > 1){
    html += "<li class=\"first\"><a href=\"" + resultsurl + title + ".html\"><<</a></li>";
    html += "<li class=\"prev\"><a href=\"" + resultsurl + title + (navigation.currentPage - 1 == 1 ? "" : ('-' + (navigation.currentPage - 1))) + ".html\" rel=\"prev\"><</a></li>";
  }


  var lo = Math.max(1, navigation.currentPage - 4);
  var hi = Math.min(navigation.lastPage, navigation.currentPage + 4);
  // console.log('lo:' + lo + ' cr: ' + navigation.currentPage + ' hi: ' + hi + ' ls: ' + navigation.lastPage);
  for (var i = lo; i <= hi; ++i) {
    if (navigation.currentPage == i) {
      html += "<li class=\"current\">" + i + "</li>";
    } else {
      if (i == navigation.currentPage - 1) {
        html += "<li class=\"prev\"><a href=\"" + resultsurl + title + (i == 1 ? "" : ('-' + i)) + ".html\" rel=\"prev\">" + i + "</a></li>";
      } else if (i == navigation.currentPage + 1) {
        html += "<li class=\"next\"><a href=\"" + resultsurl + title + '-' + i + ".html\" rel=\"next\">" + i + "</a></li>";
      } else {
        html += "<li><a href=\"" + resultsurl + title + (i == 1 ? "" : ('-' + i)) + ".html\">" + i + "</a></li>";
      }
    }
  }

  
  if (navigation.currentPage < navigation.lastPage) {
    html += "<li class=\"next\"><a href=\"" + resultsurl + title + '-' + (navigation.currentPage + 1) + ".html\" rel=\"next\">></a></li>";
    html += "<li class=\"last\"><a href=\"" + resultsurl + title + '-' + navigation.lastPage + ".html\">>></a></li>";
  }
  html += "</ul>"
  return html;
}

function writeResultsPage(title, results, navigation) {
  var fs = require("fs"),
    outfile = resultsfile + title + (navigation.currentPage > 1 ? ('-' + navigation.currentPage) : "") + ".html",
    content;

  content = "<html><head>";
  content += "<link rel=\"stylesheet\" media=\"screen\" href=\"application.css\">";
  content += "<link rel=\"stylesheet\" media=\"screen\" href=\"results.css\">";
  content += "<title>Search results: " + title + "</title></head><body>";
  content += "<div id=\"content\">"
  content += writeResultsList(title, results);
  content += writeNavigation(title, navigation);
  content += "</div>"
  content += "</body></html>"

  fs.write(outfile, content, 'w');
}

function updateHistory(info, url) {
  var historypage = require("fs").open('results/results.html', 'rw');
  while (!historypage.atEnd()) {
    var line = historypage.readLine();
    if (line.indexOf('class=\"searches\"')) {
      // console.log("logging: " + url);
      historypage.writeLine("<li><span class=\"search-term\"><a href=\"" + url + "\">" + info.t + "</a></span>" +
        "<span class=\"search-info\">[" + info.b + " bikes | " + info.p + " pages]</span>" +
        "<span class=\"search-date\">" + Date() + "</span></li>");
      break;
    }
  }
  historypage.flush();
  historypage.close();
}


function search(terms, gridview) {
  var searchstring = terms.join('+');

  var openPage = function (pageurl) {
    var page = webpage.create();
    page.onConsoleMessage = consoleToConsole;
    console.log('Loading ' + pageurl);
    t = Date.now();
    page.open(pageurl, function(status) {
      if (status !== 'success') {
        console.log('FAIL to load ' + pageurl);
      } else {
        console.log('Loading time ' + (Date.now() - t) + ' msec');

        /** 1 **/
        // var links = page.evaluate(getLinks);
        // for (var i in links) {
        //   console.log(links[i]);
        // }

        /** 2 **/
        // TODO: hanlde no results
        var results = page.evaluate(getResults, gridview);
        if (!results.length) {
          console.log('  ~~ no bikes found ~~');
          phantom.exit();
        }
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

        if (!tp) {
          var numbikes = page.evaluate(function (){
            var b = parseInt(document.querySelector('#content h1').innerHTML, 10);
            if (!isNaN(b)) {
              return b;
            }
            return parseInt(document.querySelector('#content h1').innerHTML.substring(5), 10)
          });
          console.log(numbikes);
          tp = page.evaluate(function(){
            var pagelinks = document.querySelectorAll('.pagination a');
            if (pagelinks.length > 1) {
              var lastlink = pagelinks[pagelinks.length - 1].getAttribute('href');
              // console.log(lastlink);
              return parseInt(lastlink.slice(lastlink.indexOf("page=")+5), 10);
            }
            return 1;
          });
          console.log("" + tp + " pages");
          updateHistory({t: searchstring, b: numbikes, p: tp}, resultsurl + searchstring + ".html");
        }

        writeResultsPage(searchstring, results, {currentPage: cp, lastPage: tp});

        page.close();
        if (++cp <= tp)
        {
          openPage(searchurl + searchstring + pagequery + cp + gridquery);
        } else {
          // console.log('bye bye');
          phantom.exit();
        }
      }

    });
  }
  openPage(searchurl + searchstring + gridquery);
}



terms = Array.prototype.slice.call(system.args, 1);
var results = search(terms, gridview);
// for (var i in results) {
//   console.log('{ ' + results[i].t + ", " + results[i].l + ", " + results[i].i);
// }

// phantom.exit();