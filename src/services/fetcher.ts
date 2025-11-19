import axios, {
  AxiosHeaderValue,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

// we will create a simple interface to define the exact shape of the response data we get back from request using Axios in the case of success/failure
export interface fetchResponse {
  url: string;
  html: string | null;
  success: boolean;
  status: number | null;
  contentType?: AxiosHeaderValue;
  contentLength?: AxiosHeaderValue;
  errorMessage?: string;
  fullErrorData?: any;
}

// this function accepts accepts any URL as a string and uses Axios to send a request to the URL and get back an html webpage from the server
// it also promotes strict type-safety to determine the shape of data-structures used

export const fetchPage = async (url: string): Promise<fetchResponse> => {
  const config: AxiosRequestConfig = {
    timeout: 10000,
    validateStatus: () => true,
    headers: {
      Accept: "text/html",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  };
  try {
    const response: AxiosResponse = await axios.get(url, config);

    const data: fetchResponse = {
      url,
      html: response.data,
      success: true,
      status: response.status,
      contentType: response.headers["Content-Type"],
      contentLength: response.headers["Content-Length"],
    };

    return data;
  } catch (err: any) {
    const error: fetchResponse = {
      url,
      html: null,
      success: false,
      status: null,
      errorMessage: err.message,
      fullErrorData: err,
    };
    return error;
  }
};
