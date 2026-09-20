from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from deep_translator import MyMemoryTranslator

from gtts import gTTS
from gtts.lang import tts_langs
from gtts.tts import gTTSError

from langdetect import (
    detect_langs,
    DetectorFactory,
)


# ============================================================
# CONFIGURAÇÕES
# ============================================================

DetectorFactory.seed = 0

BASE_DIR = Path(__file__).resolve().parent

AUDIO_DIR = BASE_DIR / "audio"

AUDIO_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="Tradutor e Gerador de Áudio API",
    description=(
        "API para tradução, detecção automática "
        "de idioma e geração de áudio MP3."
    ),
    version="1.2.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PASTA DE ÁUDIO
# ============================================================

app.mount(
    "/audio",
    StaticFiles(
        directory=str(AUDIO_DIR)
    ),
    name="audio",
)


# ============================================================
# IDIOMAS GTTS
# ============================================================

TTS_LANGUAGES = tts_langs()


# ============================================================
# CÓDIGOS DO APP -> MYMEMORY
# ============================================================

MYMEMORY_LANGUAGE_MAP = {

    "en": "en-GB",

    "pt": "pt-BR",

    "es": "es-ES",

    "fr": "fr-FR",

    "de": "de-DE",

    "it": "it-IT",

    "ja": "ja-JP",

    "ko": "ko-KR",

    "ru": "ru-RU",

    "zh-CN": "zh-CN",

    "zh-TW": "zh-TW",

    "ar": "ar-SA",

    "hi": "hi-IN",

    "nl": "nl-NL",

    "pl": "pl-PL",

    "tr": "tr-TR",

    "uk": "uk-UA",

    "vi": "vi-VN",

    "id": "id-ID",
}


# ============================================================
# LANGDETECT -> APP
# ============================================================

LANGDETECT_TO_APP = {

    "en": "en",

    "pt": "pt",

    "es": "es",

    "fr": "fr",

    "de": "de",

    "it": "it",

    "ja": "ja",

    "ko": "ko",

    "ru": "ru",

    "zh-cn": "zh-CN",

    "zh-tw": "zh-TW",

    "ar": "ar",

    "hi": "hi",

    "nl": "nl",

    "pl": "pl",

    "tr": "tr",

    "uk": "uk",

    "vi": "vi",

    "id": "id",
}


# ============================================================
# NOMES VISUAIS
# ============================================================

LANGUAGE_DISPLAY_NAMES = {

    "en": "English",

    "pt": "Português",

    "es": "Español",

    "fr": "Français",

    "de": "Deutsch",

    "it": "Italiano",

    "ja": "日本語",

    "ko": "한국어",

    "ru": "Русский",

    "zh-CN": "中文 (简体)",

    "zh-TW": "中文 (繁體)",

    "ar": "العربية",

    "hi": "हिन्दी",

    "nl": "Nederlands",

    "pl": "Polski",

    "tr": "Türkçe",

    "uk": "Українська",

    "vi": "Tiếng Việt",

    "id": "Bahasa Indonesia",
}


# ============================================================
# MAPA GTTS
# ============================================================

TTS_CODE_MAP = {

    code.lower(): code

    for code
    in TTS_LANGUAGES.keys()

}


# ============================================================
# MODELOS
# ============================================================


class DetectLanguageRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description=(
            "Texto utilizado para "
            "detectar o idioma."
        ),
    )


class TranslateRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description=(
            "Texto que será traduzido."
        ),
    )

    target: str = Field(
        ...,
        min_length=2,
        max_length=20,
        description=(
            "Idioma de destino. "
            "Exemplo: en, es, ja."
        ),
    )

    source: str = Field(
        default="auto",
        min_length=2,
        max_length=20,
        description=(
            "Idioma original ou auto."
        ),
    )


class AudioRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )

    lang: str = Field(
        ...,
        min_length=2,
        max_length=20,
    )

    slow: bool = False


class TranslateAudioRequest(BaseModel):

    text: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )

    target: str = Field(
        ...,
        min_length=2,
        max_length=20,
    )

    source: str = Field(
        default="auto",
        min_length=2,
        max_length=20,
    )

    slow: bool = False


# ============================================================
# LIMPAR TEXTO
# ============================================================

def clean_text(
    text: str
) -> str:

    cleaned = text.strip()

    if not cleaned:

        raise HTTPException(
            status_code=400,
            detail=(
                "O texto não pode estar vazio."
            )
        )

    return cleaned


# ============================================================
# NORMALIZAR IDIOMA
# ============================================================

def normalize_translation_language(
    language: str
) -> str:

    language = language.strip()

    if language.lower() == "auto":

        return "auto"


    for app_code in MYMEMORY_LANGUAGE_MAP:

        if (
            app_code.lower()
            ==
            language.lower()
        ):

            return app_code


    raise HTTPException(
        status_code=400,
        detail=(
            "Idioma de tradução "
            f"não suportado: {language}"
        )
    )


# ============================================================
# CONVERTER PARA MYMEMORY
# ============================================================

def convert_to_mymemory_code(
    language: str
) -> str:

    if language == "auto":

        return "auto"


    language = (
        normalize_translation_language(
            language
        )
    )


    code = (
        MYMEMORY_LANGUAGE_MAP.get(
            language
        )
    )


    if not code:

        raise HTTPException(
            status_code=400,
            detail=(
                "Idioma não configurado "
                f"no MyMemory: {language}"
            )
        )


    return code


# ============================================================
# NORMALIZAR GTTS
# ============================================================

def normalize_tts_language(
    language: str
) -> str:

    language = language.strip()


    canonical = (
        TTS_CODE_MAP.get(
            language.lower()
        )
    )


    if canonical:

        return canonical


    raise HTTPException(
        status_code=400,
        detail=(
            "Idioma de áudio "
            f"não suportado: {language}"
        )
    )


# ============================================================
# NOME DO IDIOMA
# ============================================================

def get_language_display_name(
    code: str
) -> str:

    return (
        LANGUAGE_DISPLAY_NAMES.get(
            code,
            TTS_LANGUAGES.get(
                code,
                code
            )
        )
    )


# ============================================================
# DETECTAR IDIOMA
# ============================================================

def detect_source_language(
    text: str
):

    text = clean_text(
        text
    )


    # Textos extremamente pequenos
    # não são confiáveis.

    if len(text) < 4:

        return None, None


    try:

        results = detect_langs(
            text
        )


        if not results:

            return None, None


        best = results[0]


        raw_language = (
            best.lang
            .strip()
            .lower()
        )


        confidence = float(
            best.prob
        )


        app_language = (
            LANGDETECT_TO_APP.get(
                raw_language
            )
        )


        if not app_language:

            print(
                "[IDIOMA NÃO MAPEADO] "
                f"{raw_language}"
            )

            return (
                None,
                confidence
            )


        if (
            app_language
            not in
            MYMEMORY_LANGUAGE_MAP
        ):

            return (
                None,
                confidence
            )


        print(
            "[IDIOMA DETECTADO] "
            f"{raw_language} -> "
            f"{app_language} "
            f"({confidence:.2%})"
        )


        return (
            app_language,
            confidence
        )


    except Exception as error:

        print(
            "[ERRO DETECÇÃO] "
            f"{type(error).__name__}: "
            f"{error}"
        )


        return (
            None,
            None
        )


# ============================================================
# RESOLVER IDIOMA ORIGINAL
# ============================================================

def resolve_source_language(
    text: str,
    source: str
):

    source = source.strip()


    if source.lower() != "auto":

        normalized = (
            normalize_translation_language(
                source
            )
        )

        return (
            normalized,
            None,
            None
        )


    detected_source, confidence = (
        detect_source_language(
            text
        )
    )


    if detected_source:

        return (
            detected_source,
            detected_source,
            confidence
        )


    # Caso o langdetect não consiga,
    # deixa o MyMemory tentar automaticamente.

    return (
        "auto",
        None,
        confidence
    )


# ============================================================
# TRADUZIR
# ============================================================

def translate_text(
    text: str,
    source: str,
    target: str
) -> str:

    text = clean_text(
        text
    )


    source = (
        normalize_translation_language(
            source
        )
    )


    target = (
        normalize_translation_language(
            target
        )
    )


    # --------------------------------------------------------
    # ORIGEM = DESTINO
    # --------------------------------------------------------

    if (
        source != "auto"
        and
        source == target
    ):

        return text


    # --------------------------------------------------------
    # MYMEMORY
    # --------------------------------------------------------

    mymemory_source = (
        convert_to_mymemory_code(
            source
        )
    )


    mymemory_target = (
        convert_to_mymemory_code(
            target
        )
    )


    print(
        "[TRADUÇÃO] "
        f"{source} -> {target} "
        f"({mymemory_source} -> "
        f"{mymemory_target})"
    )


    try:

        translator = (
            MyMemoryTranslator(
                source=mymemory_source,
                target=mymemory_target,
            )
        )


        translated = (
            translator.translate(
                text
            )
        )


        if not translated:

            raise HTTPException(
                status_code=500,
                detail=(
                    "A tradução retornou vazia."
                )
            )


        return translated


    except HTTPException:

        raise


    except Exception as error:

        print(
            "[ERRO TRADUÇÃO] "
            f"{type(error).__name__}: "
            f"{error}"
        )


        raise HTTPException(
            status_code=502,
            detail=(
                "Não foi possível realizar "
                "a tradução neste momento. "
                f"Erro: "
                f"{type(error).__name__}"
            )
        )


# ============================================================
# CRIAR ÁUDIO
# ============================================================

def create_audio(
    text: str,
    lang: str,
    slow: bool = False
) -> str:

    text = clean_text(
        text
    )


    lang = (
        normalize_tts_language(
            lang
        )
    )


    filename = (
        f"{uuid4().hex}.mp3"
    )


    filepath = (
        AUDIO_DIR
        /
        filename
    )


    try:

        tts = gTTS(
            text=text,
            lang=lang,
            slow=slow,
        )


        tts.save(
            str(filepath)
        )


        print(
            "[ÁUDIO GERADO] "
            f"{filename}"
        )


        return filename


    except gTTSError as error:

        print(
            "[ERRO GTTS] "
            f"{type(error).__name__}: "
            f"{error}"
        )


        if filepath.exists():

            filepath.unlink()


        raise HTTPException(
            status_code=502,
            detail=(
                "Não foi possível "
                "gerar o áudio."
            )
        )


    except Exception as error:

        print(
            "[ERRO ÁUDIO] "
            f"{type(error).__name__}: "
            f"{error}"
        )


        if filepath.exists():

            filepath.unlink()


        raise HTTPException(
            status_code=500,
            detail=(
                "Erro interno ao gerar "
                "o áudio."
            )
        )


# ============================================================
# URL DO ÁUDIO
# ============================================================

def build_audio_url(
    request: Request,
    filename: str
) -> str:

    base_url = (
        str(
            request.base_url
        )
        .rstrip("/")
    )


    return (
        f"{base_url}"
        f"/audio/"
        f"{filename}"
    )


# ============================================================
# HOME
# ============================================================

@app.get("/")
def root():

    return {

        "app":
            "Tradutor e Gerador de Áudio",

        "version":
            "1.2.0",

        "status":
            "online",

        "translator":
            "MyMemory",

        "language_detector":
            "langdetect",

        "tts":
            "gTTS",

        "docs":
            "/docs",

    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {

        "status":
            "ok",

        "service":
            "translator-audio-api",

    }


# ============================================================
# LISTAR IDIOMAS
# ============================================================

@app.get("/languages")
def get_languages():

    languages = []


    for code in MYMEMORY_LANGUAGE_MAP:

        tts_code = (
            TTS_CODE_MAP.get(
                code.lower()
            )
        )


        # Só mostra se houver voz
        # correspondente no gTTS.

        if not tts_code:

            continue


        languages.append(
            {

                "code":
                    code,

                "name":
                    get_language_display_name(
                        code
                    ),

                "voice_name":
                    TTS_LANGUAGES.get(
                        tts_code,
                        code
                    ),

            }
        )


    languages.sort(
        key=lambda item:
            item["name"].lower()
    )


    return {

        "total":
            len(languages),

        "languages":
            languages,

    }


# ============================================================
# DETECTAR IDIOMA
# ============================================================

@app.post("/detect-language")
def detect_language(
    data: DetectLanguageRequest
):

    text = (
        data.text.strip()
    )


    # Evita detecção muito cedo.

    if len(text) < 4:

        return {

            "success":
                True,

            "detected_source":
                None,

            "detection_confidence":
                None,

        }


    (
        detected_source,
        detection_confidence
    ) = detect_source_language(
        text
    )


    detected_name = None


    if detected_source:

        detected_name = (
            get_language_display_name(
                detected_source
            )
        )


    return {

        "success":
            True,

        "detected_source":
            detected_source,

        "detected_name":
            detected_name,

        "detection_confidence":
            detection_confidence,

    }


# ============================================================
# TRADUZIR
# ============================================================

@app.post("/translate")
def translate(
    data: TranslateRequest
):

    (
        effective_source,
        detected_source,
        detection_confidence
    ) = resolve_source_language(
        text=data.text,
        source=data.source,
    )


    translated_text = (
        translate_text(
            text=data.text,
            source=effective_source,
            target=data.target,
        )
    )


    return {

        "success":
            True,

        "original":
            data.text.strip(),

        "translated":
            translated_text,

        "source":
            data.source,

        "effective_source":
            effective_source,

        "detected_source":
            detected_source,

        "detection_confidence":
            detection_confidence,

        "target":
            data.target,

    }


# ============================================================
# GERAR ÁUDIO
# ============================================================

@app.post("/audio")
def generate_audio(
    data: AudioRequest,
    request: Request
):

    lang = (
        normalize_tts_language(
            data.lang
        )
    )


    filename = (
        create_audio(
            text=data.text,
            lang=lang,
            slow=data.slow,
        )
    )


    audio_url = (
        build_audio_url(
            request,
            filename
        )
    )


    return {

        "success":
            True,

        "text":
            data.text.strip(),

        "language":
            lang,

        "slow":
            data.slow,

        "filename":
            filename,

        "audio_url":
            audio_url,

    }


# ============================================================
# TRADUZIR + GERAR ÁUDIO
# ============================================================

@app.post("/translate-audio")
def translate_and_generate_audio(
    data: TranslateAudioRequest,
    request: Request
):

    # --------------------------------------------------------
    # DESCOBRIR ORIGEM
    # --------------------------------------------------------

    (
        effective_source,
        detected_source,
        detection_confidence
    ) = resolve_source_language(
        text=data.text,
        source=data.source,
    )


    # --------------------------------------------------------
    # DESTINO
    # --------------------------------------------------------

    target = (
        normalize_translation_language(
            data.target
        )
    )


    # --------------------------------------------------------
    # TRADUZIR
    # --------------------------------------------------------

    translated_text = (
        translate_text(
            text=data.text,
            source=effective_source,
            target=target,
        )
    )


    # --------------------------------------------------------
    # VOZ
    # --------------------------------------------------------

    tts_lang = (
        normalize_tts_language(
            target
        )
    )


    filename = (
        create_audio(
            text=translated_text,
            lang=tts_lang,
            slow=data.slow,
        )
    )


    audio_url = (
        build_audio_url(
            request,
            filename
        )
    )


    return {

        "success":
            True,

        "original":
            data.text.strip(),

        "translated":
            translated_text,

        "source":
            data.source,

        "effective_source":
            effective_source,

        "detected_source":
            detected_source,

        "detection_confidence":
            detection_confidence,

        "target":
            target,

        "audio": {

            "filename":
                filename,

            "url":
                audio_url,

            "language":
                tts_lang,

            "slow":
                data.slow,

        },

    }


# ============================================================
# EXECUÇÃO
# ============================================================

if __name__ == "__main__":

    import uvicorn


    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )