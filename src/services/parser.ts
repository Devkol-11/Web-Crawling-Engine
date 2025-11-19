import * as cheerio from "cheerio";

// we will create an exact shape of the data structure we expect from the return value of the function (which loads an html page with cherrio)
export interface parseResponse {
  $: cheerio.CheerioAPI;
  success: boolean;
  errorMessage?: any;
}

//this function accepts an html webpage as a string and uses cheerio to load the html document with type-safety
export const parsePage = (html: string): parseResponse => {
  try {
    const $: cheerio.CheerioAPI = cheerio.load(html);
    const data: parseResponse = {
      $,
      success: true,
    };
    return data;
  } catch (err: any) {
    const error: parseResponse = {
      $: null as any,
      success: false,
      errorMessage: err.message,
    };
    return error;
  }
};
