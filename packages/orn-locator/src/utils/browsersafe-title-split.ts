// spell-checker: ignore domutils

declare let window: any | undefined;

const clean = (str: string) => str.replace(/\s+/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '');

export type TitleParts = {html: string; title: string; numberText: string | null;  number: string | null; shortTitle: string | null};

export const titleSplit = (html: string) => {

  if (typeof window === 'undefined') {
    const globals = globalThis as any;
    const titleDoc = globals.parseDocument(html);

    const numberElement = globals.domutils.findOne((node: any) => node.attribs.class.includes('os-number'), titleDoc.children);
    const numberWithoutText = numberElement?.children.filter((node: any) => !node.attribs?.class.includes('os-part-text'));
    const justTheNumber = numberWithoutText && numberWithoutText.length > 0 && globals.domutils.textContent(numberWithoutText);
    const numberTextPart = numberElement && globals.domutils.textContent(numberElement);
    const shortTitleElement = globals.domutils.findOne((node: any) => node.attribs.class === 'os-text', titleDoc.children);
    const shortTitle = shortTitleElement && globals.domutils.textContent(shortTitleElement);
    return {
      html,
      number: justTheNumber ? clean(justTheNumber): justTheNumber, 
      numberText: numberTextPart ? clean(numberTextPart) : numberTextPart,
      title: clean(globals.domutils.textContent(titleDoc)),
      shortTitle: shortTitle ? clean(shortTitle) : shortTitle,
    };
  } else {
    const parser = new window.DOMParser();
    const titleDoc = parser.parseFromString(html, 'text/html');

    const numberElement = titleDoc.querySelector('.os-number');
    const numberElementClone = numberElement?.cloneNode(true);
    numberElementClone?.querySelector('.os-part-text')?.remove();
    const justTheNumber = numberElementClone?.textContent; 
    const numberText = numberElement?.textContent;
    const shortTitleElement = titleDoc.querySelector('.os-text');
    const shortTitle = shortTitleElement?.textContent;
    return {
      html,
      number: justTheNumber ? clean(justTheNumber) : justTheNumber,
      numberText: numberText ? clean(numberText) : numberText,
      title: clean(titleDoc.documentElement.textContent),
      shortTitle: shortTitle ? clean(shortTitle) : shortTitle,
    };

  }
};
