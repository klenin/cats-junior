const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const contests = JSON.stringify(require('./LocalServerFiles/contests.json'));
const problems = JSON.stringify(require('./LocalServerFiles/problems.json'));
const users = JSON.stringify(require('./LocalServerFiles/users.json'));

let fs = require('fs');

fs.readFile('./LocalServerFiles/results.html', function (err, html) {
  err ? () => {throw err} : null;

  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/cats/main.pl?f=contests;filter=json;sort=Sd;sort_dir=1;json=1') {
      res.end(contests);
    } else if (req.url === '/cats/main.pl?f=users;cid=897579;rows=300;sort=0;sort_dir=0;json=1') {
      res.end(users);
    } else if (req.url === '/cats/main.pl?f=problem_text;notime=1;nospell=1;noformal=1;cid=897579;nokw=1;json=1') {
      res.end(problems);
    } else if (req.url === '/cats/main.pl?f=rank_table_content;cid=897579') {
      res.end(html);
    };

    console.log(req.url);
  });

  server.listen(port, hostname, () => {
    console.log(`Server running at localhost`);
  });

});