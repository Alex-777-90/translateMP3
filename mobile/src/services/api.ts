import {
  fetch as expoFetch,
} from "expo/fetch";

import {
  File,
  Paths,
} from "expo-file-system";


// ============================================================
// CONFIGURAÇÃO DA API
// ============================================================

/*
  POR ENQUANTO:

  Mantemos o IP local para continuar testando.

  Depois do deploy na Vercel, troque por algo como:

  https://seu-projeto.vercel.app
*/

export const API_BASE_URL =
  "https://translate-mp-3.vercel.app";


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const DEFAULT_TIMEOUT =
  30000;

const AUDIO_TIMEOUT =
  60000;


// ============================================================
// TIPOS - IDIOMAS
// ============================================================

export interface Language {

  code: string;

  name: string;

  voice_name?: string;

}


interface LanguagesResponse {

  total: number;

  languages: Language[];

}


// ============================================================
// TIPOS - DETECÇÃO DE IDIOMA
// ============================================================

export interface DetectLanguageRequest {

  text: string;

}


export interface DetectLanguageResponse {

  success: boolean;

  detected_source:
    string | null;

  detected_name?:
    string | null;

  detection_confidence:
    number | null;

}


// ============================================================
// TIPOS - TRADUÇÃO
// ============================================================

export interface TranslateRequest {

  text: string;

  source?: string;

  target: string;

}


export interface TranslateResponse {

  success: boolean;

  original: string;

  translated: string;

  source: string;

  effective_source?:
    string;

  detected_source:
    string | null;

  detection_confidence:
    number | null;

  target: string;

}


// ============================================================
// TIPOS - GERAR ÁUDIO
// ============================================================

export interface GenerateAudioRequest {

  text: string;

  lang: string;

  slow?: boolean;

}


/*
  IMPORTANTE:

  O backend não retorna mais:

  audio_url

  Agora recebemos os bytes do MP3,
  salvamos no cache do celular
  e retornamos:

  audio_uri
*/

export interface GenerateAudioResponse {

  success: boolean;

  filename: string;

  audio_uri: string;

  mime_type: string;

}


// ============================================================
// TIPOS - TRADUZIR + GERAR ÁUDIO
// ============================================================

export interface TranslateAudioRequest {

  text: string;

  source?: string;

  target: string;

  slow?: boolean;

}


export interface TranslateAudioResponse {

  success: boolean;

  filename: string;

  audio_uri: string;

  mime_type: string;

}


// ============================================================
// HEALTH
// ============================================================

export interface HealthResponse {

  status: string;

  service: string;

}


// ============================================================
// ERRO PERSONALIZADO
// ============================================================

export class ApiError
  extends Error {

  status?: number;

  data?: unknown;


  constructor(
    message: string,
    status?: number,
    data?: unknown
  ) {

    super(
      message
    );


    this.name =
      "ApiError";


    this.status =
      status;


    this.data =
      data;

  }

}


// ============================================================
// MONTAR URL
// ============================================================

function buildUrl(
  endpoint: string
): string {

  const base =
    API_BASE_URL.replace(
      /\/+$/,
      ""
    );


  const path =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;


  return (
    `${base}${path}`
  );

}


// ============================================================
// EXTRAIR MENSAGEM DE ERRO
// ============================================================

function extractErrorMessage(
  data: unknown,
  fallback: string
): string {

  if (
    typeof data === "object"
    &&
    data !== null
  ) {

    const obj =
      data as Record<
        string,
        unknown
      >;


    // FastAPI:
    //
    // {
    //   "detail": "Mensagem..."
    // }

    if (
      typeof obj.detail ===
      "string"
    ) {

      return obj.detail;

    }


    if (
      typeof obj.message ===
      "string"
    ) {

      return obj.message;

    }


    /*
      Erro de validação:

      {
        "detail": [
          {
            "msg": "..."
          }
        ]
      }
    */

    if (
      Array.isArray(
        obj.detail
      )
      &&
      obj.detail.length > 0
    ) {

      const firstError =
        obj.detail[0];


      if (
        typeof firstError ===
        "object"
        &&
        firstError !== null
      ) {

        const errorObject =
          firstError as Record<
            string,
            unknown
          >;


        if (
          typeof errorObject.msg ===
          "string"
        ) {

          return (
            errorObject.msg
          );

        }

      }

    }

  }


  return fallback;

}


// ============================================================
// REQUEST JSON
// ============================================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<T> {

  const controller =
    new AbortController();


  const timeoutId =
    setTimeout(
      () => {

        controller.abort();

      },
      timeout
    );


  try {

    const response =
      await fetch(
        buildUrl(
          endpoint
        ),
        {

          ...options,

          signal:
            controller.signal,

          headers: {

            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            ...(
              options.headers
              ||
              {}
            ),

          },

        }
      );


    // ========================================================
    // LER RESPOSTA
    // ========================================================

    let data:
      unknown = null;


    const contentType =
      response.headers.get(
        "content-type"
      );


    if (
      contentType?.includes(
        "application/json"
      )
    ) {

      data =
        await response.json();

    } else {

      const responseText =
        await response.text();


      data =
        responseText
        ||
        null;

    }


    // ========================================================
    // ERRO HTTP
    // ========================================================

    if (
      !response.ok
    ) {

      const message =
        extractErrorMessage(

          data,

          `Erro ${response.status} ao acessar o servidor.`

        );


      throw new ApiError(

        message,

        response.status,

        data

      );

    }


    return (
      data as T
    );


  } catch (error) {

    // ========================================================
    // TIMEOUT
    // ========================================================

    if (
      error instanceof Error
      &&
      error.name ===
      "AbortError"
    ) {

      throw new ApiError(
        "O servidor demorou muito para responder."
      );

    }


    // ========================================================
    // ERRO JÁ TRATADO
    // ========================================================

    if (
      error instanceof ApiError
    ) {

      throw error;

    }


    // ========================================================
    // CONEXÃO
    // ========================================================

    console.error(
      "Erro de comunicação com API:",
      error
    );


    throw new ApiError(
      "Não foi possível conectar ao servidor. "
      +
      "Verifique se o backend está online."
    );


  } finally {

    clearTimeout(
      timeoutId
    );

  }

}


// ============================================================
// LER ERRO DE RESPOSTA BINÁRIA
// ============================================================

async function readBinaryError(
  response: Response
): Promise<unknown> {

  const contentType =
    response.headers.get(
      "content-type"
    );


  try {

    if (
      contentType?.includes(
        "application/json"
      )
    ) {

      return (
        await response.json()
      );

    }


    const text =
      await response.text();


    return (
      text
      ||
      null
    );


  } catch {

    return null;

  }

}


// ============================================================
// GERAR NOME DO ARQUIVO
// ============================================================

function createAudioFileName(
  prefix:
    string = "traducao"
): string {

  const timestamp =
    Date.now();


  const random =
    Math.random()
      .toString(36)
      .slice(
        2,
        8
      );


  return (
    `${prefix}-${timestamp}-${random}.mp3`
  );

}


// ============================================================
// REQUEST DE MP3
// ============================================================

async function requestAudioFile(
  endpoint: string,
  body: unknown,
  prefix:
    string = "traducao"
): Promise<{
  filename: string;
  audio_uri: string;
  mime_type: string;
}> {

  const controller =
    new AbortController();


  const timeoutId =
    setTimeout(
      () => {

        controller.abort();

      },
      AUDIO_TIMEOUT
    );


  try {

    // ========================================================
    // CHAMAR BACKEND
    // ========================================================

    const response =
      await expoFetch(
        buildUrl(
          endpoint
        ),
        {

          method:
            "POST",

          signal:
            controller.signal,

          headers: {

            Accept:
              "audio/mpeg",

            "Content-Type":
              "application/json",

          },

          body:
            JSON.stringify(
              body
            ),

        }
      );


    // ========================================================
    // ERRO DO BACKEND
    // ========================================================

    if (
      !response.ok
    ) {

      const errorData =
        await readBinaryError(
          response as unknown as Response
        );


      const message =
        extractErrorMessage(

          errorData,

          `Erro ${response.status} ao gerar o áudio.`

        );


      throw new ApiError(

        message,

        response.status,

        errorData

      );

    }


    // ========================================================
    // VERIFICAR CONTENT-TYPE
    // ========================================================

    const contentType =
      response.headers.get(
        "content-type"
      )
      ||
      "audio/mpeg";


    /*
      Se por algum motivo o servidor
      retornar JSON com status 200,
      não queremos salvar isso como MP3.
    */

    if (
      contentType.includes(
        "application/json"
      )
    ) {

      const unexpectedData =
        await response.json();


      throw new ApiError(
        extractErrorMessage(
          unexpectedData,
          "O servidor não retornou um arquivo de áudio válido."
        ),
        response.status,
        unexpectedData
      );

    }


    // ========================================================
    // RECEBER BYTES DO MP3
    // ========================================================

    const bytes =
      await response.bytes();


    if (
      !bytes
      ||
      bytes.byteLength === 0
    ) {

      throw new ApiError(
        "O servidor retornou um arquivo de áudio vazio."
      );

    }


    // ========================================================
    // CRIAR ARQUIVO NO CACHE
    // ========================================================

    const filename =
      createAudioFileName(
        prefix
      );


    const audioFile =
      new File(
        Paths.cache,
        filename
      );


    /*
      File.write aceita Uint8Array.

      O arquivo fica no cache
      privado do aplicativo.
    */

    await audioFile.write(
      bytes
    );


    console.log(
      "Áudio salvo no cache:",
      audioFile.uri
    );


    // ========================================================
    // RETORNAR URI LOCAL
    // ========================================================

    return {

      filename,

      audio_uri:
        audioFile.uri,

      mime_type:
        contentType,

    };


  } catch (error) {

    // ========================================================
    // TIMEOUT
    // ========================================================

    if (
      error instanceof Error
      &&
      error.name ===
      "AbortError"
    ) {

      throw new ApiError(
        "A geração do áudio demorou muito para responder."
      );

    }


    // ========================================================
    // ERRO TRATADO
    // ========================================================

    if (
      error instanceof ApiError
    ) {

      throw error;

    }


    console.error(
      "Erro ao receber MP3:",
      error
    );


    throw new ApiError(
      "Não foi possível receber ou salvar o áudio."
    );


  } finally {

    clearTimeout(
      timeoutId
    );

  }

}


// ============================================================
// HEALTH
// ============================================================

export async function checkHealth():
Promise<HealthResponse> {

  return request<HealthResponse>(

    "/health",

    {
      method:
        "GET",
    }

  );

}


// ============================================================
// BUSCAR IDIOMAS
// ============================================================

export async function getLanguages():
Promise<Language[]> {

  const response =
    await request<
      LanguagesResponse
    >(

      "/languages",

      {
        method:
          "GET",
      }

    );


  if (
    !Array.isArray(
      response.languages
    )
  ) {

    throw new ApiError(
      "O servidor retornou uma lista de idiomas inválida."
    );

  }


  return (
    response.languages
  );

}


// ============================================================
// DETECTAR IDIOMA
// ============================================================

export async function detectLanguage(
  text: string
): Promise<DetectLanguageResponse> {

  const cleanedText =
    text.trim();


  if (
    cleanedText.length < 4
  ) {

    return {

      success:
        true,

      detected_source:
        null,

      detected_name:
        null,

      detection_confidence:
        null,

    };

  }


  return request<
    DetectLanguageResponse
  >(

    "/detect-language",

    {

      method:
        "POST",

      body:
        JSON.stringify(
          {

            text:
              cleanedText,

          }
        ),

    },

    15000

  );

}


// ============================================================
// TRADUZIR
// ============================================================

export async function translateText(
  data: TranslateRequest
): Promise<TranslateResponse> {

  const text =
    data.text.trim();


  if (
    !text
  ) {

    throw new ApiError(
      "Digite um texto para traduzir."
    );

  }


  if (
    !data.target
  ) {

    throw new ApiError(
      "Selecione o idioma de destino."
    );

  }


  return request<
    TranslateResponse
  >(

    "/translate",

    {

      method:
        "POST",

      body:
        JSON.stringify(
          {

            text,

            source:
              data.source
              ||
              "auto",

            target:
              data.target,

          }
        ),

    }

  );

}


// ============================================================
// GERAR ÁUDIO
// ============================================================

export async function generateAudio(
  data: GenerateAudioRequest
): Promise<GenerateAudioResponse> {

  const text =
    data.text.trim();


  if (
    !text
  ) {

    throw new ApiError(
      "Não há texto para gerar o áudio."
    );

  }


  if (
    !data.lang
  ) {

    throw new ApiError(
      "Selecione o idioma do áudio."
    );

  }


  const result =
    await requestAudioFile(

      "/audio",

      {

        text,

        lang:
          data.lang,

        slow:
          data.slow
          ??
          false,

      },

      "traducao"

    );


  return {

    success:
      true,

    filename:
      result.filename,

    audio_uri:
      result.audio_uri,

    mime_type:
      result.mime_type,

  };

}


// ============================================================
// TRADUZIR + GERAR ÁUDIO
// ============================================================

export async function
translateAndGenerateAudio(
  data: TranslateAudioRequest
): Promise<TranslateAudioResponse> {

  const text =
    data.text.trim();


  if (
    !text
  ) {

    throw new ApiError(
      "Digite um texto."
    );

  }


  if (
    !data.target
  ) {

    throw new ApiError(
      "Selecione o idioma de destino."
    );

  }


  const result =
    await requestAudioFile(

      "/translate-audio",

      {

        text,

        source:
          data.source
          ||
          "auto",

        target:
          data.target,

        slow:
          data.slow
          ??
          false,

      },

      "traducao"

    );


  return {

    success:
      true,

    filename:
      result.filename,

    audio_uri:
      result.audio_uri,

    mime_type:
      result.mime_type,

  };

}