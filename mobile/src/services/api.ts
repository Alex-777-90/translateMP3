// ============================================================
// CONFIGURAÇÃO DA API
// ============================================================

/*
  IMPORTANTE:

  Se estiver usando um CELULAR FÍSICO com Expo Go,
  NÃO use:

  http://127.0.0.1:8000
  http://localhost:8000

  Porque "localhost" no celular significa
  o próprio celular.

  Use o endereço IPv4 do computador.

  Para descobrir:

  ipconfig
*/


export const API_BASE_URL =
  "http://192.168.15.72:8000";


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const DEFAULT_TIMEOUT =
  30000;


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

  /*
    O backend pode retornar qual
    idioma efetivamente foi usado.
  */
  effective_source?:
    string;

  /*
    Quando source = auto,
    estes campos informam
    o idioma encontrado.
  */
  detected_source:
    string | null;

  detection_confidence:
    number | null;

  target: string;

}


// ============================================================
// TIPOS - ÁUDIO
// ============================================================

export interface GenerateAudioRequest {

  text: string;

  lang: string;

  slow?: boolean;

}


export interface GenerateAudioResponse {

  success: boolean;

  text: string;

  language: string;

  slow: boolean;

  filename: string;

  audio_url: string;

}


// ============================================================
// TIPOS - TRADUZIR + ÁUDIO
// ============================================================

export interface TranslateAudioRequest {

  text: string;

  source?: string;

  target: string;

  slow?: boolean;

}


export interface TranslateAudioResponse {

  success: boolean;

  original: string;

  translated: string;

  source: string;

  effective_source?:
    string;

  detected_source?:
    string | null;

  detection_confidence?:
    number | null;

  target: string;

  audio: {

    filename: string;

    url: string;

    language: string;

    slow: boolean;

  };

}


// ============================================================
// TIPOS - HEALTH
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
// NORMALIZAR URL
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
    typeof data ===
      "object"
    &&
    data !== null
  ) {

    const obj =
      data as Record<
        string,
        unknown
      >;


    // --------------------------------------------------------
    // FastAPI:
    //
    // {
    //   "detail": "Mensagem"
    // }
    // --------------------------------------------------------

    if (
      typeof obj.detail ===
        "string"
    ) {

      return obj.detail;

    }


    // --------------------------------------------------------
    // Formato alternativo
    // --------------------------------------------------------

    if (
      typeof obj.message ===
        "string"
    ) {

      return obj.message;

    }


    // --------------------------------------------------------
    // Erro de validação FastAPI
    // --------------------------------------------------------

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
// REQUEST GENÉRICO
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

      const text =
        await response.text();


      data =
        text || null;

    }


    // ========================================================
    // ERRO HTTP
    // ========================================================

    if (!response.ok) {

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
    // ERRO DE CONEXÃO
    // ========================================================

    console.error(
      "Erro de comunicação com API:",
      error
    );


    throw new ApiError(
      "Não foi possível conectar ao servidor. "
      +
      "Verifique se o backend está ligado e se o celular e o computador estão na mesma rede."
    );


  } finally {

    clearTimeout(
      timeoutId
    );

  }

}


// ============================================================
// TESTAR BACKEND
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


  /*
    Textos muito pequenos não são
    confiáveis para identificação.

    O HomeScreen também faz essa
    verificação, mas deixamos aqui
    como proteção adicional.
  */

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


  if (!text) {

    throw new ApiError(
      "Digite um texto para traduzir."
    );

  }


  if (!data.target) {

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


  if (!text) {

    throw new ApiError(
      "Não há texto para gerar o áudio."
    );

  }


  if (!data.lang) {

    throw new ApiError(
      "Selecione o idioma do áudio."
    );

  }


  return request<
    GenerateAudioResponse
  >(
    "/audio",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          {

            text,

            lang:
              data.lang,

            slow:
              data.slow
              ??
              false,

          }
        ),
    },

    /*
      gTTS pode demorar um
      pouco mais.
    */
    60000
  );

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


  if (!text) {

    throw new ApiError(
      "Digite um texto."
    );

  }


  if (!data.target) {

    throw new ApiError(
      "Selecione o idioma de destino."
    );

  }


  return request<
    TranslateAudioResponse
  >(
    "/translate-audio",
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

            slow:
              data.slow
              ??
              false,

          }
        ),
    },

    60000
  );

}