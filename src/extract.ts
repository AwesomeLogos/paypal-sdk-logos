import { promises as fsPromises } from 'fs';
import * as logos from '@paypal/sdk-logos';
import { html } from '@krakenjs/jsx-pragmatic';


const directory = process.env.OUTPUT_DIR || './docs/images';


const nameExceptions = {
  'boletobancario': 'boleto',
}

function findSvgFunctionName(logoID:string, logoOrMark:string): string|null {
  const target = `get${logoID}${logoOrMark == 'logo' ? '' : 'mark'}svg`;
  for (const theExport of Object.getOwnPropertyNames(logos)) {
    if (theExport.toLowerCase() == target) {
      return theExport;
    }
  }
  return null;
}

export async function oldmain() {
  console.log(logos.LOGO);
  const nameSet = new Set<string>();
  for (const logoID of Object.values(logos.LOGO)) {
    nameSet.add(String(logoID));
  }

  console.log(`INFO: ${nameSet.size} unique logo names`);

  const calledFns = new Set<string>();

  for (const logoOrMark of ['logo', 'mark' ]) {
    for (const rawName of nameSet) {
      const name = nameExceptions[rawName] || rawName;

      const fn = findSvgFunctionName(name, logoOrMark);
      if (!fn) {
        if (logoOrMark != 'mark') {   // there are almost no marks
          console.error(`ERROR: could not find function for ${name}`);
        }
        continue;
      }
      calledFns.add(fn);

      const colors = logos[`${name.toUpperCase()}_LOGO_COLORS`];
      if (!colors) {
        console.error(`ERROR: could not find colors for ${name}`);
        continue;
      }

      let svgCount = 0;
      for (const color of Object.keys(colors)) {
        if (color == 'black' || color == 'white') {
          // skip these, they are not interesting
          continue;
        }
        svgCount++;
        const suffix = (logoOrMark == 'logo' ? '' : '_mark') + (color == 'default' ? '' : `_${color}`);
        const filename = `${directory}/${name}${suffix}.svg`
        const svg = logos[fn]({ logoColor: color }).render(html());
        await fsPromises.writeFile(filename, svg);
      }
      if (svgCount == 0) {
        console.error(`ERROR: no SVGs generated for ${name}`);
      }
    }
  }

  console.log(calledFns);
  for (const theExport of Object.getOwnPropertyNames(logos)) {
    if (theExport.startsWith('get') && !calledFns.has(theExport)) {
      console.log(`WARNING: ${theExport} was not called`);
    }
  }
}

const colorExceptions = {
  'GlyphBank': 'GLYPH_BANK_LOGO_COLORS',
  'GlyphCard': 'GLYPH_CARD_LOGO_COLORS',
  'Amex': '',
  'Discover': '',
  'Elo': '',
  'Hiper': '',
  'Jcb': '',
  'Mastercard': '',
  'Visa': ''
};

async function main() {

  for (const theExport of Object.getOwnPropertyNames(logos)) {
    if (theExport.startsWith('get') == false || theExport.endsWith('SVG') == false) {
      continue;
    }
    let logoID = theExport.slice(3, -3);
    console.log(`INFO: extracting ${logoID}`);


    let colorID = `${logoID.toUpperCase()}_LOGO_COLORS`;
    if (logoID in colorExceptions) {
      colorID = colorExceptions[logoID];
    } else if (logoID.endsWith('Mark')) {
      colorID = `${logoID.slice(0, -4).toUpperCase()}_LOGO_COLORS`;
    }
    const colors = colorID == '' ? { 'default': {} } : logos[colorID];
    if (!colors) {
      console.error(`ERROR: could not find colors for ${logoID} (${colorID})`);
      continue;
    }
    let svgCount = 0;
    for (const colorName of Object.keys(colors)) {
      if (colorName == 'black' || colorName == 'white') {
        // skip these, they are not interesting
        continue;
      }
      svgCount++;
      const suffix = colorName == 'default' ? '' : `_${colorName}`;
      const filename = `${directory}/${logoID.toLowerCase()}${suffix}.svg`
      const svg = logos[theExport](colors[colorName]).render(html());
      //console.log(`DEBUG: writing ${filename} with colors ${JSON.stringify(colors[colorName])}`);
      await fsPromises.writeFile(filename, svg);
    }
    if (svgCount == 0) {
      console.error(`ERROR: no SVGs generated for ${logoID}`);
    }
  }
}


main()
  .then(() => { console.log(`INFO: extraction complete at ${new Date().toISOString()}`); })
  .catch((err) => { console.error(err); });