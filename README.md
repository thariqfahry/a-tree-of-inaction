# A Tree of Inaction

https://treeofinaction.com/

This project started out as a criticism of people making compilations of 'educate yourself' links - I noticed that many of them linked to each other, and did nothing towards solving the issues they linked to (à la Change.org petitions). I thought it'd be a technically cool bit of social commentary to build a web scraper that drew a network graph of connections between those compilations.

My opinions have since changed - the project is no longer meant as a criticism, but as an exploration.

<div align="left">
      <a href="https://treeofinaction.com">
         <img src="https://raw.githubusercontent.com/thariqfahry/a-tree-of-inaction/main/screenshot.jpg" style="width:100%;">
      </a>
</div>

## Building
The 'backend' currently runs on Python 3.9 inside Cloud Functions. It is necessary to have a backend since client-side web scraping is not possible due to CORS.

The JS is vanilla, and can be directly run on a host such as Live Server.
