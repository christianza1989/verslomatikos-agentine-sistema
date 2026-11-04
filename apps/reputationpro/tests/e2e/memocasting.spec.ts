import { test, expect } from '@playwright/test';

test('Memocasting demo gives the same choices for every rating and links to its real Google profile', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('link',{name:'Atverti testinę anketą'})).toHaveAttribute('href','/r/memocasting');
  for (const rating of [1,2,3,4,5]) {
    await page.goto('/r/memocasting');
    await expect(page).toHaveTitle(/Memocasting/);
    await expect(page.getByText('Memocasting',{exact:true})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Kaip vertinate savo patirtį?'})).toBeVisible();
    await expect(page.getByText(/Google nuoroda atveria tikrą/)).toBeVisible();
    await page.getByRole('button',{name:`${rating} ${rating===1?'žvaigždutė':'žvaigždutės'}`,exact:true}).click();
    await expect(page).toHaveURL(/\/r\/memocasting$/);
    await expect(page.getByRole('link',{name:'Rašyti atsiliepimą Google'})).toHaveAttribute('href','https://search.google.com/local/writereview?placeid=ChIJNfJ5Pf3ybGwRpia1sP-1DvQ');
    await page.getByRole('button',{name:'Rašyti privačiai'}).click();
    await expect(page.getByText('Sutinku, kad demonstracijos savininkas perskaitytų šią žinutę.')).toBeVisible();
  }
});
