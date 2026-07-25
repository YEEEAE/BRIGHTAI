import fs from 'fs';
import * as cheerio from 'cheerio';

for (const slug of ['audit','connectors','policies','approvals','reports']) {
  const html = fs.readFileSync('dist/kernel/'+slug+'/index.html','utf8');
  const dollar = cheerio.load(html);
  const h1 = dollar('h1').first().text().trim();
  const mainText = dollar('main').text().replace(/\s+/g,' ').trim().substring(0,120);
  const hasDemo = html.includes('demo') || html.includes('توضيحي');
  console.log(slug+': h1='+h1.substring(0,50)+' | main: '+mainText+' | demo:'+hasDemo);
}
