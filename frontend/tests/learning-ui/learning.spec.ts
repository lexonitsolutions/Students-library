import { test, expect } from '@playwright/test';
for (const theme of ['light','dark']) for (const width of [320,768,1440]) {
 test(`learning desk and workspace: ${theme} ${width}px`, async ({ page }) => {
  await page.setViewportSize({width,height:1000});
  await page.route('**/functions/v1/ai-learning',route=>route.fulfill({json:{text:'A process is a running program. Let us check your understanding.',quiz:[{question:'Which is a running program?',options:['Process','File'],answer:0,explanation:'A process is a program in execution.'}],flashcards:[{question:'What is a process?',answer:'A running program.'}]}}));
  await page.goto(`/?theme=${theme}`);
  await expect(page.getByRole('heading',{name:/Good .*, Jafar/})).toBeVisible();
  await expect(page.getByText('Your next discovery starts here')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByText('Your next discovery starts here').locator('../..')).toHaveCSS('opacity','1');
  await expect(page.getByRole('textbox').locator('../..')).toHaveCSS('opacity','1');
  await page.screenshot({path:`test-results/learning-home-${theme}-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'View all tools'}).click();
  await expect(page.getByRole('heading',{name:'Flashcards',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Explain a Topic/}).click();
  await page.getByRole('textbox',{name:'Your learning question'}).fill('Explain operating system processes');
  await page.getByRole('button',{name:'Ask AI',exact:true}).click();
  await expect(page.getByText('A process is a running program. Let us check your understanding.')).toBeVisible();
  await page.getByRole('button',{name:'A. Process',exact:true}).click();
  await expect(page.getByText('You got 1 of 1 correct.')).toBeVisible();
  await page.getByRole('button',{name:'Reveal answer'}).click();
  await expect(page.getByText('A running program.',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/learning-workspace-${theme}-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Learning desk',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Continue Explain operating system processes'}).click();
  await expect(page.getByText('A process is a running program. Let us check your understanding.')).toBeVisible();
 });
}
test('failed responses can retry without duplicating the question; PDF is sent',async({page})=>{
 let attempts=0;
 await page.route('**/functions/v1/ai-learning',route=>{attempts++; expect(route.request().postDataBuffer()?.includes(Buffer.from('notes.pdf'))).toBe(true); return attempts===1?route.fulfill({status:503,json:{error:'Temporarily unavailable'}}):route.fulfill({json:{text:'A summary of your notes.',quiz:[],flashcards:[]}});});
 await page.goto('/');
 await page.getByRole('button',{name:/Notes Summarizer/}).click();
 await page.locator('input[type=file]').setInputFiles({name:'notes.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 test fixture')});
 await page.getByRole('textbox').fill('Summarize my attached notes');
 await page.getByRole('button',{name:'Ask AI',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Temporarily unavailable');
 await page.getByRole('button',{name:'Retry response'}).click();
 await expect(page.getByText('A summary of your notes.')).toBeVisible();
 await expect(page.getByRole('log').getByText('Summarize my attached notes',{exact:true})).toHaveCount(1);
});

test('stop cancels a pending response and allows another question',async({page})=>{
 await page.route('**/functions/v1/ai-learning',async route=>{ await new Promise(resolve=>setTimeout(resolve,1500)); await route.fulfill({json:{text:'Late response',quiz:[],flashcards:[]}}).catch(()=>{}); });
 await page.goto('/');
 await page.getByRole('button',{name:/Explain a Topic/}).click();
 await page.getByRole('textbox').fill('Explain a binary tree');
 await page.getByRole('button',{name:'Ask AI',exact:true}).click();
 await page.getByRole('button',{name:'Stop',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Response stopped');
 await expect(page.getByRole('button',{name:'Ask AI',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Learning desk',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Learn with AI',exact:true})).toBeVisible();
});
