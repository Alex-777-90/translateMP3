import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import LanguagePicker, {
  LanguageOption,
} from "../components/LanguagePicker";

import AudioPlayer from "../components/AudioPlayer";

import {
  detectLanguage,
  generateAudio,
  getLanguages,
  translateText,
} from "../services/api";


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const MAX_TEXT_LENGTH = 5000;

const DETECTION_DELAY = 700;

const MIN_DETECTION_LENGTH = 4;


// ============================================================
// COMPONENTE
// ============================================================

export default function HomeScreen() {

  // ==========================================================
  // TEXTO
  // ==========================================================

  const [
    text,
    setText,
  ] = useState("");


  const [
    translatedText,
    setTranslatedText,
  ] = useState("");


  // ==========================================================
  // IDIOMAS
  // ==========================================================

  const [
    languages,
    setLanguages,
  ] = useState<LanguageOption[]>([]);


  const [
    sourceLanguage,
    setSourceLanguage,
  ] = useState("auto");


  const [
    targetLanguage,
    setTargetLanguage,
  ] = useState("en");


  // ==========================================================
  // DETECÇÃO AUTOMÁTICA
  // ==========================================================

  const [
    detectedSource,
    setDetectedSource,
  ] = useState<string | null>(
    null
  );


  const [
    detectionConfidence,
    setDetectionConfidence,
  ] = useState<number | null>(
    null
  );


  const [
    detectingLanguage,
    setDetectingLanguage,
  ] = useState(false);


  // ==========================================================
  // ÁUDIO
  // ==========================================================

  const [
    audioUrl,
    setAudioUrl,
  ] = useState<string | null>(
    null
  );


  const [
    slowVoice,
    setSlowVoice,
  ] = useState(false);


  // ==========================================================
  // LOADING
  // ==========================================================

  const [
    loadingLanguages,
    setLoadingLanguages,
  ] = useState(true);


  const [
    translating,
    setTranslating,
  ] = useState(false);


  const [
    generatingAudio,
    setGeneratingAudio,
  ] = useState(false);


  // ==========================================================
  // CARREGAR IDIOMAS
  // ==========================================================

  useEffect(() => {

    loadLanguages();

  }, []);


  async function loadLanguages() {

    try {

      setLoadingLanguages(
        true
      );


      const data =
        await getLanguages();


      setLanguages(
        data
      );


      const englishExists =
        data.some(
          (language) =>
            language.code
              .toLowerCase()
            ===
            "en"
        );


      if (
        !englishExists
        &&
        data.length > 0
      ) {

        setTargetLanguage(
          data[0].code
        );

      }

    } catch (error) {

      console.error(
        "Erro ao carregar idiomas:",
        error
      );


      Alert.alert(
        "Erro",
        "Não foi possível carregar os idiomas disponíveis."
      );

    } finally {

      setLoadingLanguages(
        false
      );

    }

  }


  // ==========================================================
  // DETECTAR IDIOMA AUTOMATICAMENTE ENQUANTO DIGITA
  // ==========================================================

  useEffect(() => {

    if (
      sourceLanguage !== "auto"
    ) {

      setDetectedSource(
        null
      );

      setDetectionConfidence(
        null
      );

      setDetectingLanguage(
        false
      );

      return;

    }


    const cleanedText =
      text.trim();


    if (
      cleanedText.length
      <
      MIN_DETECTION_LENGTH
    ) {

      setDetectedSource(
        null
      );

      setDetectionConfidence(
        null
      );

      setDetectingLanguage(
        false
      );

      return;

    }


    let cancelled =
      false;


    const timer =
      setTimeout(
        async () => {

          try {

            if (
              !cancelled
            ) {

              setDetectingLanguage(
                true
              );

            }


            const result =
              await detectLanguage(
                cleanedText
              );


            if (
              cancelled
            ) {

              return;

            }


            setDetectedSource(
              result.detected_source
              ??
              null
            );


            setDetectionConfidence(
              result.detection_confidence
              ??
              null
            );


          } catch (error) {

            if (
              cancelled
            ) {

              return;

            }


            console.log(
              "Erro ao detectar idioma:",
              error
            );


            setDetectedSource(
              null
            );


            setDetectionConfidence(
              null
            );


          } finally {

            if (
              !cancelled
            ) {

              setDetectingLanguage(
                false
              );

            }

          }

        },

        DETECTION_DELAY
      );


    return () => {

      cancelled = true;

      clearTimeout(
        timer
      );

    };

  }, [
    text,
    sourceLanguage,
  ]);


  // ==========================================================
  // CONTADOR
  // ==========================================================

  const characterCount =
    useMemo(
      () => text.length,
      [text]
    );


  // ==========================================================
  // NOME DO IDIOMA DETECTADO
  // ==========================================================

  const detectedLanguageName =
    useMemo(() => {

      if (
        !detectedSource
      ) {

        return null;

      }


      const found =
        languages.find(
          (language) =>
            language.code
              .toLowerCase()
            ===
            detectedSource
              .toLowerCase()
        );


      return (
        found?.name
        ??
        detectedSource
      );

    }, [
      detectedSource,
      languages,
    ]);


  // ==========================================================
  // ALTERAR TEXTO
  // ==========================================================

  function handleTextChange(
    value: string
  ) {

    setText(
      value
    );


    setTranslatedText(
      ""
    );


    setAudioUrl(
      null
    );


    setDetectedSource(
      null
    );


    setDetectionConfidence(
      null
    );

  }


  // ==========================================================
  // ALTERAR IDIOMA DE ORIGEM
  // ==========================================================

  function handleSourceLanguageChange(
    language: string
  ) {

    setSourceLanguage(
      language
    );


    setTranslatedText(
      ""
    );


    setAudioUrl(
      null
    );


    setDetectedSource(
      null
    );


    setDetectionConfidence(
      null
    );


    setDetectingLanguage(
      false
    );

  }


  // ==========================================================
  // ALTERAR IDIOMA DE DESTINO
  // ==========================================================

  function handleTargetLanguageChange(
    language: string
  ) {

    setTargetLanguage(
      language
    );


    setTranslatedText(
      ""
    );


    setAudioUrl(
      null
    );

  }


  // ==========================================================
  // TRADUZIR
  // ==========================================================

  async function handleTranslate() {

    const cleanedText =
      text.trim();


    if (
      !cleanedText
    ) {

      Alert.alert(
        "Digite um texto",
        "Escreva alguma coisa antes de realizar a tradução."
      );

      return;

    }


    if (
      !targetLanguage
    ) {

      Alert.alert(
        "Selecione um idioma",
        "Escolha o idioma para o qual deseja traduzir."
      );

      return;

    }


    try {

      setTranslating(
        true
      );


      setTranslatedText(
        ""
      );


      setAudioUrl(
        null
      );


      const result =
        await translateText({

          text:
            cleanedText,

          source:
            sourceLanguage,

          target:
            targetLanguage,

        });


      setTranslatedText(
        result.translated
      );


      if (
        sourceLanguage === "auto"
      ) {

        if (
          result.detected_source
        ) {

          setDetectedSource(
            result.detected_source
          );

        }


        if (
          result.detection_confidence
          !==
          null
          &&
          result.detection_confidence
          !==
          undefined
        ) {

          setDetectionConfidence(
            result.detection_confidence
          );

        }

      }


    } catch (error) {

      console.error(
        "Erro ao traduzir:",
        error
      );


      Alert.alert(
        "Erro na tradução",
        getErrorMessage(
          error
        )
      );

    } finally {

      setTranslating(
        false
      );

    }

  }


  // ==========================================================
  // GERAR ÁUDIO
  // ==========================================================

  async function handleGenerateAudio() {

    if (
      !translatedText.trim()
    ) {

      Alert.alert(
        "Tradução necessária",
        "Primeiro faça a tradução do texto."
      );

      return;

    }


    try {

      setGeneratingAudio(
        true
      );


      setAudioUrl(
        null
      );


      const result =
        await generateAudio({

          text:
            translatedText,

          lang:
            targetLanguage,

          slow:
            slowVoice,

        });


      // ======================================================
      // NOVO FORMATO
      // ======================================================
      //
      // Antes:
      // result.audio_url
      //
      // Agora:
      // result.audio_uri
      //
      // O MP3 já está salvo no cache
      // local do celular.
      // ======================================================

      setAudioUrl(
        result.audio_uri
      );


    } catch (error) {

      console.error(
        "Erro ao gerar áudio:",
        error
      );


      Alert.alert(
        "Erro ao gerar áudio",
        getErrorMessage(
          error
        )
      );

    } finally {

      setGeneratingAudio(
        false
      );

    }

  }


  // ==========================================================
  // LIMPAR
  // ==========================================================

  function handleClear() {

    setText(
      ""
    );


    setTranslatedText(
      ""
    );


    setAudioUrl(
      null
    );


    setSourceLanguage(
      "auto"
    );


    setDetectedSource(
      null
    );


    setDetectionConfidence(
      null
    );


    setDetectingLanguage(
      false
    );


    setSlowVoice(
      false
    );

  }


  // ==========================================================
  // FORMATAR CONFIANÇA
  // ==========================================================

  function formatConfidence(
    confidence: number | null
  ): string | null {

    if (
      confidence === null
      ||
      !Number.isFinite(
        confidence
      )
    ) {

      return null;

    }


    const percentage =
      Math.round(
        confidence * 100
      );


    return (
      `${percentage}%`
    );

  }


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (

    <KeyboardAvoidingView
      style={
        styles.container
      }
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >

      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* ================================================= */}
        {/* CABEÇALHO                                        */}
        {/* ================================================= */}

        <View
          style={
            styles.header
          }
        >

          <Text
            style={
              styles.title
            }
          >
            Tradutor & Áudio
          </Text>


          <Text
            style={
              styles.subtitle
            }
          >
            Traduza textos e transforme a tradução em áudio.
          </Text>

        </View>


        {/* ================================================= */}
        {/* TEXTO                                            */}
        {/* ================================================= */}

        <View
          style={
            styles.section
          }
        >

          <View
            style={
              styles.sectionHeader
            }
          >

            <Text
              style={
                styles.label
              }
            >
              Texto
            </Text>


            <Text
              style={
                styles.characterCount
              }
            >
              {
                characterCount
              }
              /
              {
                MAX_TEXT_LENGTH
              }
            </Text>

          </View>


          <TextInput
            style={
              styles.textInput
            }
            value={
              text
            }
            onChangeText={
              handleTextChange
            }
            placeholder="Digite ou cole o texto que deseja traduzir..."
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
            maxLength={
              MAX_TEXT_LENGTH
            }
            autoCorrect
          />

        </View>


        {/* ================================================= */}
        {/* IDIOMA ORIGINAL                                  */}
        {/* ================================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.label
            }
          >
            Idioma original
          </Text>


          {
            loadingLanguages
              ? (

                <View
                  style={
                    styles.loadingLanguages
                  }
                >

                  <ActivityIndicator />


                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Carregando idiomas...
                  </Text>

                </View>

              )
              : (

                <LanguagePicker
                  languages={
                    languages
                  }
                  value={
                    sourceLanguage
                  }
                  onChange={
                    handleSourceLanguageChange
                  }
                  includeAuto
                />

              )
          }


          {/* ================================================= */}
          {/* DETECTANDO                                       */}
          {/* ================================================= */}

          {
            (
              sourceLanguage === "auto"
              &&
              detectingLanguage
            )
            && (

              <View
                style={
                  styles.detectingContainer
                }
              >

                <ActivityIndicator
                  size="small"
                />


                <Text
                  style={
                    styles.detectingText
                  }
                >
                  Detectando idioma...
                </Text>

              </View>

            )
          }


          {/* ================================================= */}
          {/* IDIOMA DETECTADO                                 */}
          {/* ================================================= */}

          {
            (
              sourceLanguage === "auto"
              &&
              !detectingLanguage
              &&
              detectedSource
              &&
              detectedLanguageName
            )
            && (

              <View
                style={
                  styles.detectedContainer
                }
              >

                <View
                  style={
                    styles.detectedIconContainer
                  }
                >

                  <Text
                    style={
                      styles.detectedIcon
                    }
                  >
                    ✓
                  </Text>

                </View>


                <View
                  style={
                    styles.detectedInfo
                  }
                >

                  <Text
                    style={
                      styles.detectedLabel
                    }
                  >
                    Idioma detectado
                  </Text>


                  <Text
                    style={
                      styles.detectedLanguage
                    }
                  >

                    {
                      detectedLanguageName
                    }


                    {
                      detectionConfidence !== null
                      &&
                      (
                        ` • ${
                          formatConfidence(
                            detectionConfidence
                          )
                        }`
                      )
                    }

                  </Text>

                </View>

              </View>

            )
          }

        </View>


        {/* ================================================= */}
        {/* SETA                                             */}
        {/* ================================================= */}

        <View
          style={
            styles.arrowContainer
          }
        >

          <Text
            style={
              styles.arrow
            }
          >
            ↓
          </Text>

        </View>


        {/* ================================================= */}
        {/* IDIOMA DESTINO                                   */}
        {/* ================================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.label
            }
          >
            Traduzir para
          </Text>


          {
            loadingLanguages
              ? (

                <View
                  style={
                    styles.loadingLanguages
                  }
                >

                  <ActivityIndicator />


                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Carregando idiomas...
                  </Text>

                </View>

              )
              : (

                <LanguagePicker
                  languages={
                    languages
                  }
                  value={
                    targetLanguage
                  }
                  onChange={
                    handleTargetLanguageChange
                  }
                />

              )
          }

        </View>


        {/* ================================================= */}
        {/* TRADUZIR                                         */}
        {/* ================================================= */}

        <TouchableOpacity
          style={[

            styles.primaryButton,

            (
              translating
              ||
              loadingLanguages
              ||
              !text.trim()
            )
            &&
            styles.disabledButton,

          ]}
          onPress={
            handleTranslate
          }
          disabled={
            translating
            ||
            loadingLanguages
            ||
            !text.trim()
          }
          activeOpacity={
            0.8
          }
        >

          {
            translating
              ? (

                <View
                  style={
                    styles.buttonLoading
                  }
                >

                  <ActivityIndicator
                    color="#ffffff"
                  />


                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Traduzindo...
                  </Text>

                </View>

              )
              : (

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Traduzir
                </Text>

              )
          }

        </TouchableOpacity>


        {/* ================================================= */}
        {/* RESULTADO                                        */}
        {/* ================================================= */}

        {
          translatedText !== ""
          && (

            <View
              style={
                styles.resultContainer
              }
            >

              <Text
                style={
                  styles.resultLabel
                }
              >
                Tradução
              </Text>


              <View
                style={
                  styles.translationBox
                }
              >

                <Text
                  selectable
                  style={
                    styles.translationText
                  }
                >
                  {
                    translatedText
                  }
                </Text>

              </View>


              {/* =========================================== */}
              {/* FALA LENTA                                 */}
              {/* =========================================== */}

              <View
                style={
                  styles.voiceOptions
                }
              >

                <View
                  style={
                    styles.voiceTextContainer
                  }
                >

                  <Text
                    style={
                      styles.voiceTitle
                    }
                  >
                    Fala mais lenta
                  </Text>


                  <Text
                    style={
                      styles.voiceDescription
                    }
                  >
                    Útil para estudar a pronúncia.
                  </Text>

                </View>


                <Switch
                  value={
                    slowVoice
                  }
                  onValueChange={(
                    value
                  ) => {

                    setSlowVoice(
                      value
                    );


                    setAudioUrl(
                      null
                    );

                  }}
                />

              </View>


              {/* =========================================== */}
              {/* GERAR ÁUDIO                                */}
              {/* =========================================== */}

              <TouchableOpacity
                style={[

                  styles.audioButton,

                  generatingAudio
                  &&
                  styles.disabledButton,

                ]}
                onPress={
                  handleGenerateAudio
                }
                disabled={
                  generatingAudio
                }
                activeOpacity={
                  0.8
                }
              >

                {
                  generatingAudio
                    ? (

                      <View
                        style={
                          styles.buttonLoading
                        }
                      >

                        <ActivityIndicator
                          color="#ffffff"
                        />


                        <Text
                          style={
                            styles.audioButtonText
                          }
                        >
                          Gerando áudio...
                        </Text>

                      </View>

                    )
                    : (

                      <Text
                        style={
                          styles.audioButtonText
                        }
                      >
                        🔊 Gerar áudio
                      </Text>

                    )
                }

              </TouchableOpacity>


              {/* =========================================== */}
              {/* PLAYER                                     */}
              {/* =========================================== */}

              {
                audioUrl
                && (

                  <View
                    style={
                      styles.playerContainer
                    }
                  >

                    <Text
                      style={
                        styles.audioReady
                      }
                    >
                      Áudio pronto
                    </Text>


                    <AudioPlayer
                      audioUrl={
                        audioUrl
                      }
                    />

                  </View>

                )
              }

            </View>

          )
        }


        {/* ================================================= */}
        {/* LIMPAR                                           */}
        {/* ================================================= */}

        {
          (
            text.length > 0
            ||
            translatedText.length > 0
          )
          && (

            <TouchableOpacity
              style={
                styles.clearButton
              }
              onPress={
                handleClear
              }
              activeOpacity={
                0.7
              }
            >

              <Text
                style={
                  styles.clearButtonText
                }
              >
                Limpar tudo
              </Text>

            </TouchableOpacity>

          )
        }


        <View
          style={
            styles.bottomSpace
          }
        />

      </ScrollView>

    </KeyboardAvoidingView>

  );

}


// ============================================================
// TRATAMENTO DE ERRO
// ============================================================

function getErrorMessage(
  error: unknown
): string {

  if (
    typeof error === "object"
    &&
    error !== null
  ) {

    if (
      "message" in error
      &&
      typeof error.message
      ===
      "string"
    ) {

      return (
        error.message
      );

    }

  }


  return (
    "Não foi possível concluir a operação. "
    +
    "Verifique sua conexão e tente novamente."
  );

}


// ============================================================
// ESTILOS
// ============================================================

const styles =
  StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor:
        "#f8fafc",

    },


    scroll: {

      flex: 1,

    },


    scrollContent: {

      paddingHorizontal:
        20,

      paddingTop:
        24,

    },


    // ========================================================
    // CABEÇALHO
    // ========================================================

    header: {

      marginBottom:
        28,

    },


    title: {

      fontSize:
        30,

      fontWeight:
        "800",

      color:
        "#0f172a",

    },


    subtitle: {

      marginTop:
        8,

      fontSize:
        15,

      lineHeight:
        22,

      color:
        "#64748b",

    },


    // ========================================================
    // SEÇÕES
    // ========================================================

    section: {

      marginBottom:
        18,

    },


    sectionHeader: {

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginBottom:
        8,

    },


    label: {

      marginBottom:
        8,

      fontSize:
        15,

      fontWeight:
        "700",

      color:
        "#334155",

    },


    characterCount: {

      marginBottom:
        8,

      fontSize:
        12,

      color:
        "#94a3b8",

    },


    // ========================================================
    // INPUT
    // ========================================================

    textInput: {

      minHeight:
        160,

      maxHeight:
        280,

      paddingHorizontal:
        16,

      paddingVertical:
        14,

      backgroundColor:
        "#ffffff",

      borderWidth:
        1,

      borderColor:
        "#cbd5e1",

      borderRadius:
        14,

      fontSize:
        16,

      lineHeight:
        23,

      color:
        "#0f172a",

    },


    // ========================================================
    // CARREGANDO IDIOMAS
    // ========================================================

    loadingLanguages: {

      minHeight:
        54,

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal:
        16,

      backgroundColor:
        "#ffffff",

      borderWidth:
        1,

      borderColor:
        "#e2e8f0",

      borderRadius:
        12,

    },


    loadingText: {

      marginLeft:
        10,

      fontSize:
        14,

      color:
        "#64748b",

    },


    // ========================================================
    // DETECTANDO
    // ========================================================

    detectingContainer: {

      flexDirection:
        "row",

      alignItems:
        "center",

      marginTop:
        10,

      paddingHorizontal:
        13,

      paddingVertical:
        10,

      backgroundColor:
        "#eff6ff",

      borderWidth:
        1,

      borderColor:
        "#bfdbfe",

      borderRadius:
        12,

    },


    detectingText: {

      marginLeft:
        10,

      fontSize:
        13,

      fontWeight:
        "700",

      color:
        "#2563eb",

    },


    // ========================================================
    // IDIOMA DETECTADO
    // ========================================================

    detectedContainer: {

      flexDirection:
        "row",

      alignItems:
        "center",

      marginTop:
        10,

      paddingHorizontal:
        13,

      paddingVertical:
        11,

      backgroundColor:
        "#ecfdf5",

      borderWidth:
        1,

      borderColor:
        "#bbf7d0",

      borderRadius:
        12,

    },


    detectedIconContainer: {

      width:
        30,

      height:
        30,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginRight:
        10,

      backgroundColor:
        "#16a34a",

      borderRadius:
        15,

    },


    detectedIcon: {

      fontSize:
        16,

      fontWeight:
        "900",

      color:
        "#ffffff",

    },


    detectedInfo: {

      flex:
        1,

    },


    detectedLabel: {

      fontSize:
        12,

      fontWeight:
        "600",

      color:
        "#15803d",

    },


    detectedLanguage: {

      marginTop:
        2,

      fontSize:
        15,

      fontWeight:
        "800",

      color:
        "#166534",

    },


    // ========================================================
    // SETA
    // ========================================================

    arrowContainer: {

      alignItems:
        "center",

      marginTop:
        -8,

      marginBottom:
        10,

    },


    arrow: {

      fontSize:
        28,

      fontWeight:
        "700",

      color:
        "#64748b",

    },


    // ========================================================
    // BOTÕES
    // ========================================================

    primaryButton: {

      minHeight:
        56,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop:
        4,

      marginBottom:
        26,

      paddingHorizontal:
        20,

      backgroundColor:
        "#2563eb",

      borderRadius:
        14,

    },


    primaryButtonText: {

      fontSize:
        16,

      fontWeight:
        "800",

      color:
        "#ffffff",

    },


    buttonLoading: {

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

    },


    disabledButton: {

      opacity:
        0.55,

    },


    // ========================================================
    // TRADUÇÃO
    // ========================================================

    resultContainer: {

      marginBottom:
        24,

    },


    resultLabel: {

      marginBottom:
        8,

      fontSize:
        17,

      fontWeight:
        "800",

      color:
        "#0f172a",

    },


    translationBox: {

      padding:
        16,

      backgroundColor:
        "#ffffff",

      borderWidth:
        1,

      borderColor:
        "#cbd5e1",

      borderRadius:
        14,

    },


    translationText: {

      fontSize:
        17,

      lineHeight:
        26,

      color:
        "#0f172a",

    },


    // ========================================================
    // VOZ
    // ========================================================

    voiceOptions: {

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginTop:
        16,

      paddingHorizontal:
        16,

      paddingVertical:
        14,

      backgroundColor:
        "#ffffff",

      borderWidth:
        1,

      borderColor:
        "#e2e8f0",

      borderRadius:
        14,

    },


    voiceTextContainer: {

      flex:
        1,

      paddingRight:
        16,

    },


    voiceTitle: {

      fontSize:
        15,

      fontWeight:
        "700",

      color:
        "#334155",

    },


    voiceDescription: {

      marginTop:
        3,

      fontSize:
        13,

      color:
        "#94a3b8",

    },


    // ========================================================
    // ÁUDIO
    // ========================================================

    audioButton: {

      minHeight:
        54,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginTop:
        16,

      paddingHorizontal:
        20,

      backgroundColor:
        "#0f172a",

      borderRadius:
        14,

    },


    audioButtonText: {

      fontSize:
        16,

      fontWeight:
        "800",

      color:
        "#ffffff",

    },


    playerContainer: {

      marginTop:
        18,

    },


    audioReady: {

      marginBottom:
        8,

      fontSize:
        14,

      fontWeight:
        "700",

      color:
        "#16a34a",

    },


    // ========================================================
    // LIMPAR
    // ========================================================

    clearButton: {

      alignItems:
        "center",

      justifyContent:
        "center",

      minHeight:
        48,

      marginBottom:
        10,

      borderWidth:
        1,

      borderColor:
        "#cbd5e1",

      borderRadius:
        12,

    },


    clearButtonText: {

      fontSize:
        14,

      fontWeight:
        "700",

      color:
        "#64748b",

    },


    bottomSpace: {

      height:
        30,

    },

  });