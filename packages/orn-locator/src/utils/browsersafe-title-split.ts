
declare var globalThis: any;
declare var window: any | undefined;

const clean = (str: string) => str.replace(/\s+/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '');

export const titleSplit = (html: string) => {

  if (typeof window === 'undefined') {
    const titleDoc = globalThis.parseDocument(html);

    const numberElement = globalThis.domutils.findOne((node: any) => node.attribs.class === 'os-number', titleDoc.children);
    const numberPart = numberElement && globalThis.domutils.textContent(numberElement);
    const shortTitleElement = globalThis.domutils.findOne((node: any) => node.attribs.class === 'os-text', titleDoc.children);
    const shortTitle = shortTitleElement && globalThis.domutils.textContent(shortTitleElement);
    return {
      title: clean(globalThis.domutils.textContent(titleDoc)),
      number: numberPart ? clean(numberPart) : numberPart,
      shortTitle: shortTitle ? clean(shortTitle) : shortTitle,
    };
  } else {
    const parser = new window.DOMParser();
    const titleDoc = parser.parseFromString(html, 'text/html');

    const numberElement = titleDoc.querySelector('.os-number');
    const numberPart = numberElement && numberElement.textContent;
    const shortTitleElement = titleDoc.querySelector('.os-text');
    const shortTitle = shortTitleElement && shortTitleElement.textContent;
    return {
      title: clean(titleDoc.documentElement.textContent),
      number: numberPart ? clean(numberPart) : numberPart,
      shortTitle: shortTitle ? clean(shortTitle) : shortTitle,
    };

  }
};
