import fs from 'fs';
import pkg from 'pdfjs-dist';
const { getDocument } = pkg;

const pdfPath = './public/certificate.pdf';
const data = new Uint8Array(fs.readFileSync(pdfPath));

(async () => {
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();

  content.items.forEach(item => {
    const words = item.str.split(/\s+/);
    const totalWidth = item.width;
    const avgWidth = totalWidth / item.str.length;

    let offset = 0;

    words.forEach(word => {
      const wordWidth = word.length * avgWidth;
      const wordX = item.transform[4] + offset;
      const wordY = item.transform[5];

      console.log({
        word,
        x: parseFloat(wordX.toFixed(2)),
        y: parseFloat(wordY.toFixed(2))
      });

      offset += wordWidth + avgWidth;
    });
  });
})();
