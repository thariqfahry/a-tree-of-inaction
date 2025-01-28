# A Tree of Inaction

How many aggregators link to other aggregators?

https://thariqfahry.github.io/a-tree-of-inaction

<div align="left">
      <a href="https://thariqfahry.github.io/a-tree-of-inaction">
         <img src="https://raw.githubusercontent.com/thariqfahry/a-tree-of-inaction/main/screenshot.jpg" style="width:100%;">
      </a>
</div>

## Building the backend container image
A backend is required because the same-origin policy prevents client-side web scraping.  
```
docker build -t atoi-backend ./backend
```
