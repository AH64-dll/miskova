import puppeteer from 'puppeteer-core';
async function main(){
  const browser = await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH, args:["--no-sandbox"]});
  const page = await browser.newPage();
  await page.setViewport({width:1440, height:900});
  const shots=[];
  async function shot(url, name, selector){
    await page.goto(url, {waitUntil:'domcontentloaded'});
    await new Promise(r=>setTimeout(r,2000));
    if(selector){
      const el = await page.$(selector);
      if(el){ await el.screenshot({path:`/tmp/${name}.png`}); shots.push(name); return; }
    }
    await page.screenshot({path:`/tmp/${name}.png`, fullPage:false});
    shots.push(name);
  }
  await shot('http://localhost:3111/','visual-home-hero',null);
  // scroll to categories
  await page.evaluate(()=>document.querySelector('#categories')?.scrollIntoView());
  await new Promise(r=>setTimeout(r,1000));
  const cat = await page.$('.mk-categories-section');
  if(cat) await cat.screenshot({path:'/tmp/visual-categories.png'});
  // reviews
  await page.evaluate(()=>document.querySelector('#reviews')?.scrollIntoView());
  await new Promise(r=>setTimeout(r,1000));
  const rev = await page.$('#reviews');
  if(rev) await rev.screenshot({path:'/tmp/visual-reviews.png'});
  // collection pages header
  await page.goto('http://localhost:3111/collections/best-sellers',{waitUntil:'domcontentloaded'});
  await new Promise(r=>setTimeout(r,1500));
  await page.screenshot({path:'/tmp/visual-bestsellers-header.png', clip:{x:0,y:0,width:1440,height:260}});
  // for-her
  await page.goto('http://localhost:3111/collections/for-her',{waitUntil:'domcontentloaded'});
  await new Promise(r=>setTimeout(r,1500));
  await page.screenshot({path:'/tmp/visual-forher.png', fullPage:false});
  await browser.close();
  console.log('SHOTS:', shots.join(','));
}
main().catch(e=>{console.error(e);process.exit(1)});
